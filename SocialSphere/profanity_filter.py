# profanity_filter.py

import os
from better_profanity import profanity  
from linkify_it import LinkifyIt  

current_directory = os.path.dirname(os.path.abspath(__file__))
custom_bad_words_file = os.path.join(current_directory, 'custom_badwords.txt')

linkify = LinkifyIt()



def check_profanity(text):
    # Extract strings from `CENSOR_WORDSET` and convert them into a set of plain strings
    default_bad_words = {str(word) for word in profanity.CENSOR_WORDSET}

    if os.path.exists(custom_bad_words_file):
        # Load custom words if the file exists
        with open(custom_bad_words_file, 'r', encoding='utf-8') as file:
            custom_bad_words = {line.strip() for line in file if line.strip()}  # Use a set to avoid duplicates

        # Combine default and custom bad words into a single set
        combined_bad_words = default_bad_words | custom_bad_words  # Union of both sets
        profanity.load_censor_words(combined_bad_words)  # Load the combined word list
    else:
        print(f"Custom profanity file not found at {custom_bad_words_file}. Using default library list.")
    
    # Check if the text contains any profane words from the combined list
    return profanity.contains_profanity(text)

def clean_profanity(text):
    return profanity.censor(text)

def contains_links(comment_text):
    return linkify.test(comment_text)  



