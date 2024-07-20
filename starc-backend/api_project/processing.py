"""

Changes Likely not needed

"""

#import requests
#import json
#import random

import os
from openai import OpenAI

from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.environ.get("StarcAI_API_KEY"))

# Google API Key for function calls
# Note: this key is editable from cloud console and has preset limits 
gc_virtual_api_key = os.environ.get("GC_API_KEY")

# kept dormant now for testing purposes
def get_scoresSA(text):
    '''
    Do NOT use this anywhere in code.
    '''
    # Constructing the URL with the API key
    url_SA = f'https://us-central1-starcai.cloudfunctions.net/entry_pointSA?apikey={gc_virtual_api_key}'
    # Making the POST request with JSON data, this returns a response object in string format here for 'text' 
    response_SA = requests.post(url_SA, json={'text': text})

    # Parse the response text to a Python list
    scores = json.loads(response_SA.text)
    # Check if the scores are list and convert each element to float to be stored in our database
    if isinstance(scores, list):
        scores = [float(score) for score in scores]

    # return the sentiment scores from the cloud function
    # Order: Overall Score, Optimism, Confidence, Strategic Forecasts
    return scores

# base function for placeholder scores
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
    # Constructing the URL with the API key
    url_GPT = f'https://us-central1-starcai.cloudfunctions.net/entry_pointGPT?apikey={gc_virtual_api_key}'
    # Making the POST request with JSON data
    response = requests.post(url_GPT, json={'text': original_text})
    # return rewritten text from the cloud function as response.text
    return response

def get_rewrite(original_text):
    '''
    Use this as the function, no change needed
    '''
    response = "placeholder string"
    #return response.text
    return response

def chat_bot(prompt, chat_log=None):
    """
    Generates a response from a chatbot using the OpenAI GPT-3.5-turbo model.

    Args:
        prompt (str): The user's input prompt.
        chat_log (list, optional): The chat log history. Defaults to None.

    Returns:
        tuple: A tuple containing the chatbot's response and the updated chat log.
            - response (str): The chatbot's response.
            - chat_log (list): The updated chat log history.

    Raises:
        Exception: If there is an error in generating the response.

    Description:
        This function takes a user prompt and generates a response from a chatbot using the OpenAI GPT-3.5-turbo model.
    """
    if chat_log is None:
        chat_log = []

    # System message to define the assistant's persona
    chat_log.append({
        'role': 'system',
        'content': "You are a financial expert, knowledgable about all the laws and policies in the US \
          related to investing, taxation, businesses, and the economy. Keep your responses brief, straightforward and to the point. \
          Do not repeat back the user prompt or mention explicitly wording that makes you appear an AI bot like 'as an AI agent' etc."
    })

    # User's message
    chat_log.append({'role': 'user', 'content': prompt})

    try:
        response = client.chat.completions.create(model='gpt-3.5-turbo',
        messages=chat_log)
        chat_log.append({
            'role': 'assistant',
            'content': response.choices[0].message.content
        })

        return response.choices[0].message.content, chat_log

    except Exception as e:
        return str(e), chat_log
    
    # Example usage of chat_bot function:
        # prompt = "Is deferred revenue taxable?"
        # response, log = chat_bot(prompt)
        # print(response)
        