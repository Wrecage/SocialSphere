
import facebook
import requests
from datetime import datetime, timedelta
from django.http import JsonResponse
from .models import Event
from facebook import GraphAPIError
from django.core.cache import cache
from .facebook_config import PAGE_ID, ACCESS_TOKEN


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




def facebook_analytics(page_id, access_token):
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

    url = f'https://graph.facebook.com/v19.0/{page_id}/posts'
    params = {
        'access_token': access_token,
        'fields': 'shares,likes.summary(true),comments.summary(true),reactions.summary(true)'
    }
    response = requests.get(url, params=params)
    post_insights = response.json()

    total_likes = 0
    total_comments = 0
    total_shares = 0
    total_reactions = 0

    for post in post_insights['data']:
        total_likes += post['likes']['summary']['total_count']
        total_comments += post['comments']['summary']['total_count']
        total_shares += post.get('shares', {}).get('count', 0)
        total_reactions += post['reactions']['summary']['total_count']

    total_reactions_count = total_reactions

    return {
        'total_fan_count': fan_count,
        'total_page_views': page_views,
        'total_likes': total_likes,
        'total_comments': total_comments,
        'total_shares': total_shares,
        'total_reactions_count': total_reactions_count
    }