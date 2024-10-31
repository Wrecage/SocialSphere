import os
import base64
from groq import Groq
from django.http import JsonResponse
import json

# Function to encode image into base64 format
def encode_image(image):
    return base64.b64encode(image.read()).decode('utf-8')

# Function to generate AI-generated caption using the latest GROQ API model
def generate_caption(event_description, location, date, event_type, tone, max_words, image_base64=None, event_category=None):
    try:
        # Create the content prompt
        content = (
            f"Generate a {tone} caption in English for the following event: '{event_description}' "
            f"happening at {location} on {date}. The event type is {event_type} and it's categorized as a {event_category}. "
            f"Caption should not exceed {max_words} words."
        )

        # Initialize GROQ client
        GROQ_API_KEY = os.getenv('GROQ_API_KEY')
        client = Groq(api_key=GROQ_API_KEY)
        
        # Prepare the message with image (if available)
        messages = [{"role": "user", "content": content}]
        if image_base64:
            # Using the updated llama-3.2-11b-vision-preview model for image-based captioning
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": content},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                            },
                        },
                    ],
                }
            ]

        # Generate caption using the updated GROQ Vision API model
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.2-11b-vision-preview",  # Updated to the latest vision model
        )

        return chat_completion.choices[0].message.content

    except Exception as e:
        print(f"Error generating caption: {e}")
        return "Error generating caption"

# Function to generate description from image using the new vision model
def generate_image_description(image_base64, max_words):
    try:
        prompt = f"Describe the event image accurately and in no more than {max_words} words."
        
        # Initialize GROQ client
        GROQ_API_KEY = os.getenv('GROQ_API_KEY')
        client = Groq(api_key=GROQ_API_KEY)

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}",
                        },
                    },
                ],
            }
        ]

        # Use the new `llama-3.2-11b-vision-preview` model instead of deprecated `llava` model
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.2-11b-vision-preview"
        )

        return chat_completion.choices[0].message.content

    except Exception as e:
        print(f"Error generating image description: {e}")
        return "Error generating image description"

def handle_caption_generation_request(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Handle the image input and type of request
            if data.get('image_base64'):
                image_base64 = data.get('image_base64')
                max_words = data.get('max_words')
                generated_description = generate_image_description(image_base64, max_words)
                return JsonResponse({'generated_image_description': generated_description})
            else:
                # Handle text-based caption generation
                event_description = data.get('event_description')
                location = data.get('location')
                date = data.get('date')
                event_type = data.get('event_type')
                tone = data.get('tone')
                max_words = data.get('max_words')
                event_category = data.get('event_category')

                # Use the updated generate_caption function
                generated_caption = generate_caption(
                    event_description, location, date, event_type, tone, max_words, event_category=event_category
                )

                return JsonResponse({'generated_caption': generated_caption})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)
