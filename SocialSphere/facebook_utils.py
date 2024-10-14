
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


def get_week_labels(weeks=4):
    """Returns a list of the last 'weeks' number of weeks' labels."""
    today = datetime.today()
    return [(today - timedelta(weeks=i)).strftime("Week %U, %Y") for i in range(weeks)]

def facebook_analytics(page_id, access_token):
    # Metrics to fetch from Facebook
    metrics = 'page_fan_adds_unique,page_post_engagements,page_impressions,page_views_total'

    # Get data for the past 4 weeks (maximum 28 days)
    since_date = (datetime.now() - timedelta(weeks=4)).strftime('%Y-%m-%d')  # Last 4 weeks
    until_date = datetime.now().strftime('%Y-%m-%d')

    # Fetch page insights data with a weekly period
    url = f'https://graph.facebook.com/v20.0/{page_id}/insights'
    params = {
        'access_token': access_token,
        'metric': metrics,
        'since': since_date,
        'until': until_date,
        'period': 'week'  # Fetch weekly data
    }
    response = requests.get(url, params=params)
    page_insights = response.json()

    # Debugging: Print the entire API response to see what's returned
    # print("Facebook Page Insights Response:", page_insights)

    # Check if the 'data' field is present in the response
    if 'data' not in page_insights:
        raise ValueError(f"The 'data' field is missing from the Facebook Page Insights API response: {page_insights}")
    


    # Extract weekly values for page views (page_views_total)
    page_views_data = [item['value'] for item in page_insights['data'][3]['values']]  # Weekly page views

    # Fetch post insights data (weekly likes, reactions, comments, shares)
    url = f'https://graph.facebook.com/v20.0/{page_id}/posts'
    params = {
        'access_token': access_token,
        'fields': 'created_time,message,full_picture,shares,likes.summary(true),comments.summary(true),reactions.summary(true)'
    }
    response = requests.get(url, params=params)
    post_insights = response.json()

    # Debugging: Print the entire API response to see what's returned
    # print("Facebook Post Insights Response:", post_insights)

    # Check if the 'data' field is present in the post insights response
    if 'data' not in post_insights:
        raise ValueError(f"The 'data' field is missing from the Facebook Post Insights API response: {post_insights}")
    
    # Initialize data for tracking the most liked, commented, and shared posts
    most_liked_post = None
    most_commented_post = None
    most_shared_post = None

    # Initialize weekly data for comments, shares, reactions
    weekly_comments_data = [0] * 4
    weekly_shares_data = [0] * 4
    weekly_reactions_data = [0] * 4

    # Loop through posts and sum data for the past 4 weeks
    for post in post_insights['data']:
        # Ensure the 'created_time' field is present in the response
        if 'created_time' in post:
            post_date = datetime.strptime(post['created_time'], '%Y-%m-%dT%H:%M:%S%z')
            week_index = (datetime.now().isocalendar()[1] - post_date.isocalendar()[1]) % 4

            weekly_reactions_data[week_index] += post['reactions']['summary']['total_count']
            weekly_comments_data[week_index] += post['comments']['summary']['total_count']
            weekly_shares_data[week_index] += post.get('shares', {}).get('count', 0)

            # Update most liked, commented, and shared posts
            if most_liked_post is None or post['likes']['summary']['total_count'] > most_liked_post['likes']['summary']['total_count']:
                most_liked_post = post
            if most_commented_post is None or post['comments']['summary']['total_count'] > most_commented_post['comments']['summary']['total_count']:
                most_commented_post = post
            if most_shared_post is None or post.get('shares', {}).get('count', 0) > most_shared_post.get('shares', {}).get('count', 0):
                most_shared_post = post


    # Return data for the KPI cards and the line chart
    return {
        'labels': get_week_labels(4),  # Use the week labels for the past 4 weeks
        'total_page_views': sum(page_views_data),  # Total page views for KPI card
        'total_comments': sum(weekly_comments_data),  # Total comments for KPI card
        'total_shares': sum(weekly_shares_data),  # Total shares for KPI card
        'total_reactions_count': sum(weekly_reactions_data),  # Total reactions for KPI card
        'page_views_data': page_views_data,  # Weekly page views for the chart
        'comments_data': weekly_comments_data,  # Weekly comments for the chart
        'shares_data': weekly_shares_data,  # Weekly shares for the chart
        'reactions_data': weekly_reactions_data,  # Weekly reactions for the chart
        'most_liked_post': most_liked_post, 
        'most_commented_post': most_commented_post,
        'most_shared_post': most_shared_post
    }