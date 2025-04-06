import requests
import json
import os
import aiohttp
from openai import OpenAI
from dotenv import load_dotenv
import time
from urllib.parse import urlencode
import asyncio
from datetime import datetime

load_dotenv()

model_name = os.getenv('StarcAI_Rewrite_Model')
client = OpenAI(api_key= os.getenv('StarcAI_API_KEY'))

if model_name is None:
    raise ValueError("Rewriting model is not set in the environment variables.")


# Google API Key for function calls
gc_virtual_api_key = os.environ.get("GOOGLE_CLOUD_API_KEY")

class WarmupManager:
    def __init__(self):
        self.MAX_INSTANCES = 20
        self.WARMUP_INTERVAL = 600  # 5 minutes (300 seconds)
        self.last_activity_time = 0  # Track any GCF activity
        self.lock = asyncio.Lock()

    def update_activity_time(self):
        """Update the last activity time to now"""
        self.last_activity_time = time.time()

    async def validate_response(self, response):
        """Validate response format and content"""
        if response.status != 200:
            print(f"Failed warmup - status code: {response.status}")
            return False

        try:
            # Try to parse the response as JSON regardless of content-type
            content = await response.text()
            data = json.loads(content)
            
            # Validate expected response structure
            if not isinstance(data, dict) or 'tone' not in data or 'fls' not in data:
                print(f"Failed warmup - invalid response structure: {data}")
                return False
                
            return True
        except Exception as e:
            print(f"Failed warmup - JSON parsing error: {str(e)}")
            return False

    async def warmup_instance(self):
        """Single instance warmup request with proper validation"""
        base_url = 'https://us-central1-starcai-server.cloudfunctions.net/FinBERT-Merged'
        params = {'apikey': gc_virtual_api_key}
        url_SA = f'{base_url}?{urlencode(params)}'
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {"text": "test"}
                async with session.post(url_SA, json=payload, headers=headers) as response:
                    if await self.validate_response(response):
                        content = await response.text()
                        return json.loads(content)
                    return None
        except Exception as e:
            print(f"Warmup request failed with error: {str(e)}")
            return None

    async def warmup_all_instances(self):
        """Warm up instances with proper validation and debugging"""
        async with self.lock:
            current_time = time.time()
            
            if current_time - self.last_activity_time < self.WARMUP_INTERVAL:
                print(f"Skipping warmup - last activity was {current_time - self.last_activity_time} seconds ago")
                return True

            print(f"Starting warmup of {self.MAX_INSTANCES} instances at {datetime.now()}")
            
            warmup_tasks = [self.warmup_instance() for _ in range(self.MAX_INSTANCES)]
            results = await asyncio.gather(*warmup_tasks, return_exceptions=True)
            
            # Count only valid responses
            successful_warmups = sum(1 for r in results if r is not None and not isinstance(r, Exception))
            
            print(f"Warmup completed: {successful_warmups}/{self.MAX_INSTANCES} instances warmed successfully")
            
            if successful_warmups > 0:
                self.last_activity_time = current_time
                return True
            else:
                print("All warmups failed - check response validation logs above")
                return False

# Global warmup manager instance
warmup_manager = WarmupManager()

# -------------------------------
# SYSTEM PROMPT FOR CONVERSION
# Gives context about the task and the style based on user's request
# -------------------------------

SYSTEM_PROMPT = (
    "You are a financial analyst and investor relations expert, "
    "specialized in writing MD&A sections for public 10-K filings, 10-Q reports, and letters to stakeholders. "
    "Your task is to rewrite given MD&A sentences in a clear, professional business style that reflects the user's requested tone. "
    "Ensure that the language is precise, and that the sentence structure is consistent with investor relations industry standards. "
    "Refrain strongly from adding any new information from your side."
    "Importantly, do not make the wording so overly optimistic or unrealistic that it becomes suspicious or hard to believe. Be grounded and realistic."
    "Keep the overall context and number of sentences the same. Do not change any factual information or numbers if provided."
    "Do not repeat back the user prompt or mention explicitly wording that makes you appear an AI bot like 'as an AI agent' or 'is there anything else I can assist you with' etc."
)

def rewrite_text_with_prompt(original_text: str, prompt: str):
    '''
    Rewrite the given text based on the provided prompt.
    '''
    
    response = client.chat.completions.create(
        # model="gpt-4o",
        
        # allows for using custom GPT model that we finetuned on investor relations data from S&P 500 companies
        model=model_name,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Please rewrite the following text to {prompt}: {original_text}"}
        ],        
        max_tokens=500,
        temperature=0.5,
    )
    
    rewritten_text = response.choices[0].message.content.strip()
    return rewritten_text

def generate_sentence_suggestions(text):
    '''
    Generate sentence suggestions for the given text.
    Not being used for now.
    '''
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        max_tokens=500,
        temperature=0.2,
        response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": """You are a writer. You are given a text and your job is to generate 
             sentence-by-sentence suggestions. The suggestions should be in JSON format, with each entry containing 
             'original' and 'suggested' keys, and all suggestions should be contained in an array."""},
            {"role": "user", "content": text}
        ]
    )
    
    content = response.choices[0].message.content
    
    try:
        suggestions_dict = json.loads(content)
        suggestions = suggestions_dict.get("suggestions", [])
    except json.JSONDecodeError:
        suggestions = []
    
    return suggestions
  
async def get_scoresSA(text):
    '''
    Get sentiment and FLS scores for the given text.
    Returns a list containing [overall_score, optimism, confidence, specific_fls (trustworthy)].
    '''
    base_url = 'https://finbert-merged-351460998552.us-central1.run.app'
    params = {'apikey': gc_virtual_api_key}
    url_SA = f'{base_url}?{urlencode(params)}'
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'bearer {os.getenv("GOOGLE_CLOUD_TOKEN")}',
        'X-Goog-Api-Key': gc_virtual_api_key
    }
    
    # Simple sentence splitting
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    
    if not sentences:
        return [0.33, 0.33, 0.34, 0.33]

    # Try to warm up instances, but proceed even if warmup fails
    warmup_success = await warmup_manager.warmup_all_instances()
    if not warmup_success:
        print("Warning: Proceeding with scoring despite warmup failure")
    
    all_sentence_scores = []
    
    # Process sentences in chunks of up to 20 (10 instances * 2 sentences per instance)
    for i in range(0, len(sentences), warmup_manager.MAX_INSTANCES * 2):
        chunk = sentences[i:min(i + warmup_manager.MAX_INSTANCES * 2, len(sentences))]
        
        # Group sentences into pairs for each instance
        sentence_pairs = []
        for j in range(0, len(chunk), 2):
            if j + 1 < len(chunk):
                sentence_pairs.append(chunk[j:j+2])
            else:
                sentence_pairs.append([chunk[j]])
        
        num_real = len(sentence_pairs)
        
        async with aiohttp.ClientSession() as session:
            # Prepare exactly MAX_INSTANCES requests (real + filler)
            chunk_tasks = []
            
            # Add real sentence pair requests
            for pair in sentence_pairs:
                if len(pair) == 2:
                    payload = {"texts": pair}
                else:
                    payload = {"text": pair[0]}
                task = session.post(url_SA, json=payload, headers=headers)
                chunk_tasks.append(task)
            
            # Add filler requests to maintain constant load
            num_fillers = warmup_manager.MAX_INSTANCES - num_real
            for _ in range(num_fillers):
                filler_payload = {"text": "test filler"}
                task = session.post(url_SA, json=filler_payload, headers=headers)
                chunk_tasks.append(task)
            
            # Wait for ALL requests (real + filler) to complete
            chunk_responses = await asyncio.gather(*chunk_tasks, return_exceptions=True)
            
            # Process only the real responses
            for response in chunk_responses[:num_real]:
                try:
                    if isinstance(response, Exception):
                        raise response
                    
                    if response.status != 200:
                        print(f"Error: Non-200 status code: {response.status}")
                        continue
                    
                    content = await response.text()
                    scores = json.loads(content)
                    
                    # Handle both single and paired responses
                    if isinstance(scores, list):
                        all_sentence_scores.extend(scores)
                    else:
                        all_sentence_scores.append(scores)
                except Exception as e:
                    print(f"Error processing sentence: {str(e)}")
                    continue
            
            # Update activity time after processing chunk
            warmup_manager.update_activity_time()
    
    if not all_sentence_scores:
        return [0.33, 0.33, 0.34, 0.33]
    
    # Calculate aggregated scores across all sentences
    sum_positives = sum(s['tone']['Positive'] for s in all_sentence_scores)
    sum_neutrals = sum(s['tone']['Neutral'] for s in all_sentence_scores)
    sum_negatives = sum(s['tone']['Negative'] for s in all_sentence_scores)
    sum_specific_fls = sum(s['fls']['Specific FLS'] for s in all_sentence_scores)
    sum_non_specific_fls = sum(s['fls']['Non-specific FLS'] for s in all_sentence_scores)
    sum_not_fls = sum(s['fls']['Not FLS'] for s in all_sentence_scores)
    
    # Weights for overall score calculation
    weights = {
        'Positive': 1.0,
        'Neutral': 0.7,
        'Negative': 0.0,
        'Specific FLS': 1.0,
        'Non-specific FLS': 0.0,
        'Not FLS': 1.0
    }
    
    # Calculate overall score for each sentence and take average
    max_score = 2.0  # Sum of max weights
    sentence_scores = []
    
    for scores in all_sentence_scores:
        score = (
            sum(weights[k] * v for k, v in scores['tone'].items()) +
            sum(weights[k] * v for k, v in scores['fls'].items())
        ) / max_score * 100
        sentence_scores.append(score)
    
    overall_score = sum(sentence_scores) / len(sentence_scores)
    
    # Calculate optimism = (Positive) / (Positive + Negative) * 100
    total_pos_neg = sum_positives + sum_negatives
    optimism = (sum_positives / total_pos_neg * 100) if total_pos_neg > 0 else 50
    
    # Calculate confidence = (Positive + Neutral) / (Positive + Negative + Neutral) * 100
    total_tone = sum_positives + sum_negatives + sum_neutrals
    confidence = ((sum_positives + sum_neutrals) / total_tone * 100) if total_tone > 0 else 50
    
    # Calculate specific FLS = Specific FLS / (Specific FLS + Non-specific FLS) * 100
    total_fls = sum_specific_fls + sum_non_specific_fls
    specific_fls = (sum_specific_fls / total_fls * 100) if total_fls > 0 else 0
    
    # Truncate to 2 decimal places
    final_scores = [
        int(overall_score * 100) / 100,
        int(optimism * 100) / 100,
        int(confidence * 100) / 100,
        int(specific_fls * 100) / 100
    ]
    
    return final_scores


def chat_bot(prompt, chat_log=None):
    if chat_log is None:
        chat_log = []
        
    print(chat_log)

    if not any(msg['role'] == 'system' for msg in chat_log):
        chat_log.insert(0, {
            'role': 'system',
            'content': "You are a financial expert, knowledgeable about all the laws and policies in the US \
              related to investing, taxation, businesses, and the economy. Keep your responses brief, straightforward and to the point. \
              Do not repeat back the user prompt or mention explicitly wording that makes you appear an AI bot like 'as an AI agent' etc."
        })

    chat_log.append({'role': 'user', 'content': prompt})
    
    print(chat_log)

    try:
        print("Sending the following chat log to OpenAI API:", chat_log)
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=chat_log
        )
        print("Received response from OpenAI API:", response)
        chat_log.append({
            'role': 'assistant',
            'content': response.choices[0].message.content
        })

        return response.choices[0].message.content, chat_log

    except Exception as e:
        print("Error occurred while generating response:", str(e))
        return str(e), chat_log

async def warmup_model():
    '''
    Warms up the model by sending a minimal request.
    This helps avoid cold start latency.
    '''
    try:
        await get_scoresSA("test")  # Minimal text to warm up the model
        return True
    except Exception as e:
        print(f"Error warming up model: {e}")
        return False

# Keep track of last warmup time
last_warmup_time = 0

async def ensure_model_warm():
    '''
    Ensures the model is warm by checking the last warmup time
    and warming up if necessary (if more than 15 minutes have passed)
    '''
    global last_warmup_time
    current_time = time.time()
    
    if current_time - last_warmup_time > 600:  # 600 seconds = 10 minutes
        success = await warmup_model()
        if success:
            last_warmup_time = current_time
            print(f"Model warmed up successfully at {current_time}")
        return success
    else:
        print(f"Model still warm, last warmup was {current_time - last_warmup_time} seconds ago")
        return True