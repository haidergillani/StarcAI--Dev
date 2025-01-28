import requests
import json
import os
import aiohttp
from openai import OpenAI
from dotenv import load_dotenv
import time
from urllib.parse import urlencode

load_dotenv()

client = OpenAI(api_key= os.getenv('StarcAI_API_KEY'))

# Google API Key for function calls
gc_virtual_api_key = os.environ.get("GOOGLE_CLOUD_API_KEY")

def rewrite_text_with_prompt(original_text: str, prompt: str):
    '''
    Rewrite the given text based on the provided prompt.
    '''
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        max_tokens=500,
        temperature=0.7,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Rewrite the following text to {prompt}: {original_text}"}
        ]
    )
    
    rewritten_text = response.choices[0].message.content.strip()
    return rewritten_text

def generate_sentence_suggestions(text):
    '''
    Generate sentence suggestions for the given text.
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
    Returns a list containing [overall_score, optimism, confidence, specific_fls].
    '''
    base_url = 'https://us-central1-starcai-server.cloudfunctions.net/FinBERT-Merged'
    params = {'apikey': gc_virtual_api_key}
    url_SA = f'{base_url}?{urlencode(params)}'
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    # Simple sentence splitting
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    all_sentence_scores = []
    
    try:
        async with aiohttp.ClientSession() as session:
            # Get scores for each sentence
            for sentence in sentences:
                payload = {"text": sentence}
                async with session.post(url_SA, json=payload, headers=headers) as response:
                    if response.status != 200:
                        continue
                    
                    scores = json.loads(await response.text())
                    all_sentence_scores.append(scores)
            
            if not all_sentence_scores:
                return [0.33, 0.33, 0.34, 0.33]  # Default values
            
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
                
    except Exception as e:
        print(f"Exception in get_scoresSA: {str(e)}")
        return [0.33, 0.33, 0.34, 0.33]  # Default values in case of error

def get_rewriteGPT(original_text):
    '''
    Get rewrite suggestions from the GPT endpoint.
    '''
    base_url = 'https://us-central1-starcai-server.cloudfunctions.net/FinBERT-Merged'
    params = {'apikey': gc_virtual_api_key}
    url_GPT = f'{base_url}?{urlencode(params)}'
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    payload = {
        "text": original_text
    }
    
    try:
        response = requests.post(url_GPT, json=payload, headers=headers)
        if response.status_code != 200:
            return None
        return response
    except Exception:
        return None

def get_rewrite(original_text):
    '''
    Use this as the function, no change needed
    '''
    response = "placeholder string"
    return response

def chat_bot(prompt, chat_log=None):
    if chat_log is None:
        chat_log = []

    if not any(msg['role'] == 'system' for msg in chat_log):
        chat_log.insert(0, {
            'role': 'system',
            'content': "You are a financial expert, knowledgeable about all the laws and policies in the US \
              related to investing, taxation, businesses, and the economy. Keep your responses brief, straightforward and to the point. \
              Do not repeat back the user prompt or mention explicitly wording that makes you appear an AI bot like 'as an AI agent' etc."
        })

    chat_log.append({'role': 'user', 'content': prompt})

    try:
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=chat_log
        )
        chat_log.append({
            'role': 'assistant',
            'content': response.choices[0].message.content
        })

        return response.choices[0].message.content, chat_log

    except Exception as e:
        return str(e), chat_log

async def warmup_model():
    '''
    Warms up the model by sending a minimal request.
    '''
    try:
        await get_scoresSA("test")
        return True
    except Exception:
        return False

last_warmup_time = 0

async def ensure_model_warm():
    '''
    Ensures the model is warm by checking the last warmup time
    and warming up if necessary (if more than 15 minutes have passed)
    '''
    global last_warmup_time
    current_time = time.time()
    
    if current_time - last_warmup_time > 600:
        success = await warmup_model()
        if success:
            last_warmup_time = current_time
        return success
=======
import requests
import json
import random
import os
import aiohttp
from openai import OpenAI
from dotenv import load_dotenv
import time

load_dotenv()

client = OpenAI(api_key= os.getenv('StarcAI_API_KEY'))

# Google API Key for function calls
gc_virtual_api_key = os.environ.get("GC_API_KEY")

def rewrite_text_with_prompt(original_text: str, prompt: str):
    '''
    Acts as a member of investor relations team to rewrite the given text based on the provided prompt.
    '''
    # Define the context for the rewriting task
    system_message = 'You work for investor relations to team of any company. You are an assistant for rewriting financial communication texts into more perusasive tones or as deisred by user prompts, keeping in mind the audience of investors, stakeholders, and other relevant personnel. Make sure to not change key information and be aware of context. Very important: keep the number of sentences same and the order of sentences consistent. Ignore words like rewrite etc and focus on the actual sentence content'

    # Create the chat messages
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": f"Rewrite the following text to {prompt}: {original_text}"}
    ]

    # Generate the completion using the OpenAI API
    chat_completion = client.chat.completions.create(
        messages=messages,
        model="gpt-3.5-turbo"
    )

        # Extract the rewritten text
    rewritten_text = chat_completion.choices[0].message.content
    return rewritten_text

def generate_sentence_suggestions(text):
    '''
    Generate sentence suggestions for the given text.
    '''
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        max_tokens=500,
        temperature=0.2,
        response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": """You are a writer. You are given a text and your job is to generate 
             sentence-by-sentence suggestions. The suggestions should be in JSON format, with each entry containing 
             'original' and 'suggested' keys, and all suggestions should be contained in an array. Here are a few 
             examples:\n\n suggestions :[{'original': 'The cat sat on the mat.', 'suggested': 'The feline rested on 
             the rug.'}, {'original': 'She sells sea shells by the sea shore.', 'suggested': 'She markets marine shells 
             by the oceanfront.'}, {'original': 'He is a good boy.', 'suggested': 'He is a well-behaved child.'}] , \n\n
             json array  should be like this with suggessions as key we will parse the array through this key
             , One more thing please make sure that original text key should be same as the input text because we will
             replace the original text with the suggested text in the input text so we are dependent on the correct value of original key."""},
            {"role": "user", "content": text}
        ]
    )
    
    # Extract the content field from the response
    content = response.choices[0].message.content
    
    # Log the content for debugging
    print("Response content:", content)
    
    try:
        # Parse the JSON string within the content field
        suggestions_dict = json.loads(content)
        
        # Extract suggestions from the dictionary
        suggestions = suggestions_dict.get("suggestions", [])
    except json.JSONDecodeError as e:
        print("JSON decode error:", e)
        suggestions = []
    
    return suggestions

async def get_scoresSA(text):
    '''
    Do NOT use this anywhere in code.
    '''
    url_SA = f'https://us-central1-starcai.cloudfunctions.net/entry_pointSA?apikey={gc_virtual_api_key}'
    async with aiohttp.ClientSession() as session:
        async with session.post(url_SA, json={'text': text}) as response:
            response_text = await response.text()
            scores = json.loads(response_text)
            if isinstance(scores, list):
                scores = [float(score) for score in scores]
            return scores

async def get_scores(text):
    '''
    Use this as the function, no change needed
    '''
    # Simulate some async processing time
    import asyncio
    await asyncio.sleep(0.1)
    random_numbers = [random.uniform(1,100) for _ in range(4)]
    return random_numbers

def get_rewriteGPT(original_text):
    '''
    Do NOT use this anywhere in code. Deprecated functionality that used to make a call to Google Cloud
    '''
    url_GPT = f'https://us-central1-starcai.cloudfunctions.net/entry_pointGPT?apikey={gc_virtual_api_key}'
    response = requests.post(url_GPT, json={'text': original_text})
    return response

def get_rewrite(original_text):
    '''
    Use this as the function, no change needed
    '''
    response = "placeholder string"
    return response

def chat_bot(prompt, chat_log=None):
    if chat_log is None:
        chat_log = []
        
    print(chat_log)

    # Ensure the system message is only added once
    if not any(msg['role'] == 'system' for msg in chat_log):
        chat_log.insert(0, {
            'role': 'system',
            'content': "You are a financial expert, knowledgeable about all the laws and policies in the US \
              related to investing, taxation, businesses, and the economy. Keep your responses brief, straightforward and to the point. \
              Do not repeat back the user prompt or mention explicitly wording that makes you appear an AI bot like 'as an AI agent' etc."
        })

    # Append the new user message
    chat_log.append({'role': 'user', 'content': prompt})
    
    print(chat_log)

    try:
        print("Sending the following chat log to OpenAI API:", chat_log)
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
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
        await get_scoresSA("test") # Minimal text to warm up the model
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
    
    # If more than 10 minutes have passed since last warmup
    if current_time - last_warmup_time > 600:  # 600 seconds = 10 minutes
        success = await warmup_model()
        if success:
            last_warmup_time = current_time
            print(f"Model warmed up successfully at {current_time}")
        return success
    else:
        print(f"Model still warm, last warmup was {current_time - last_warmup_time} seconds ago")