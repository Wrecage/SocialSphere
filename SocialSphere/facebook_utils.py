
import facebook
import requests
from datetime import datetime, timedelta
from django.http import JsonResponse
from .facebook_config import PAGE_ID, ACCESS_TOKEN
from .models import Event
from facebook import GraphAPIError

def post_to_facebook(event):
    try:
        graph = facebook.GraphAPI(ACCESS_TOKEN)

        post_data = {
            'message': f'{event.title}: {event.caption}',
            'published': True,
            'scheduled_publish_time': event.date.timestamp() 
        }
        graph.put_photo(image=open(event.photo.path, 'rb'), message=event.caption)

    except GraphAPIError as e:
        print(f"Facebook Graph API Error: {e}")
        if e.code == 190:  
            print("Access token expired. Please generate a new access token.")
    except Exception as e:
        print(f"An error occurred: {e}")



def post_to_facebook_view(request, event_id):
    try:
        event = Event.objects.get(pk=event_id)
        post_to_facebook(event)
        return JsonResponse({'success': True})
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Event does not exist'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
   

def facebook_analytics(request):
    access_token = ACCESS_TOKEN
    page_id = PAGE_ID
    metrics = 'page_fan_adds_unique,page_post_engagements,page_impressions,page_views_total'
    since_date = (datetime.now() - timedelta(days=28)).strftime('%Y-%m-%d')
    until_date = datetime.now().strftime('%Y-%m-%d')

    url = f'https://graph.facebook.com/v19.0/{page_id}/insights'
    
    params = {
        'access_token': access_token,
        'metric': metrics,
        'since': since_date,
        'until': until_date
    }
    response = requests.get(url, params=params)
    page_insights = response.json()

    fan_count = sum([item['value'] for item in page_insights['data'][0]['values']])
    page_views = sum([item['value'] for item in page_insights['data'][3]['values']])

    # Get post insights including reactions
    url = f'https://graph.facebook.com/v19.0/{page_id}/posts'
    params = {
        'access_token': access_token,
        'fields': 'reactions.type(LIKE).summary(total_count).limit(0).as(like_reactions),'
                  'reactions.type(LOVE).summary(total_count).limit(0).as(love_reactions),'
                  'reactions.type(HAHA).summary(total_count).limit(0).as(haha_reactions),'
                  'reactions.type(SAD).summary(total_count).limit(0).as(sad_reactions),'
                  'reactions.type(ANGRY).summary(total_count).limit(0).as(angry_reactions),'
                  'shares,likes.summary(true),comments.summary(true)'
    }
    response = requests.get(url, params=params)
    post_insights = response.json()

    total_likes = 0
    total_comments = 0
    total_shares = 0
    total_reactions = {
        'like': 0,
        'love': 0,
        'haha': 0,
        'sad': 0,
        'angry': 0
    }

    for post in post_insights['data']:
        total_likes += post['likes']['summary']['total_count']
        total_comments += post['comments']['summary']['total_count']
        total_shares += post.get('shares', {}).get('count', 0)
        total_reactions['like'] += post['like_reactions']['summary']['total_count']
        total_reactions['love'] += post['love_reactions']['summary']['total_count']
        total_reactions['haha'] += post['haha_reactions']['summary']['total_count']
        total_reactions['sad'] += post['sad_reactions']['summary']['total_count']
        total_reactions['angry'] += post['angry_reactions']['summary']['total_count']

    total_reactions_count = sum(total_reactions.values())

    context = {
        'fan_count': fan_count,
        'page_views': page_views,
        'total_likes': total_likes,
        'total_comments': total_comments,
        'total_shares': total_shares,
        'total_reactions': total_reactions,
        'total_reactions_count': total_reactions_count
    }

    return context