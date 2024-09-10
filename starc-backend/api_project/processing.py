import requests
import json
import random
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key= os.getenv('StarcAI_API_KEY'))

# Google API Key for function calls
gc_virtual_api_key = os.environ.get("GC_API_KEY")

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
    
    # Extract the content field from the response
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
             'original' and 'suggested' keys, and all suggestions should be contained in an array. Here are a few 
             examples:\n\n suggestions :[{'original': 'The cat sat on the mat.', 'suggested': 'The feline rested on 
             the rug.'}, {'original': 'She sells sea shells by the sea shore.', 'suggested': 'She markets marine shells 
             by the oceanfront.'}, {'original': 'He is a good boy.', 'suggested': 'He is a well-behaved child.'}] , \n\n
             json array  should be like this with suggessions as key we will parse the array through this key
             , One more thing please make sure that original text key should be same as the input text because we will
             replace the original text with the suggested text in the input text so we are dependednt on the correct value of original key."""},
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

def get_scoresSA(text):
    '''
    Do NOT use this anywhere in code.
    '''
    url_SA = f'https://us-central1-starcai.cloudfunctions.net/entry_pointSA?apikey={gc_virtual_api_key}'
    response_SA = requests.post(url_SA, json={'text': text})
    scores = json.loads(response_SA.text)
    if isinstance(scores, list):
        scores = [float(score) for score in scores]
    return scores

def get_scores(text):
    '''
    Use this as the function, no change needed
    '''
    random_numbers = [random.uniform(1,100) for _ in range(4)]
    return random_numbers

def get_rewriteGPT(original_text):
    '''
    Do NOT use this anywhere in code.
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