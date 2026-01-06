#!/bin/bash
# Reddit Ads API - Create Post (Creative)
# Usage: ./create-post.sh <headline> <destination_url> [image_url] [cta]
#
# Post types:
# - TEXT: Free-form text (cannot be used for conversion campaigns!)
# - IMAGE: Image with destination URL (required for conversions)
# - VIDEO: Video with destination URL
# - CAROUSEL: Multiple images (up to 6)
#
# Call to Action options:
# "Learn More", "Sign Up", "Shop Now", "Book Now", "Contact Us",
# "Get a Quote", "Download", "Install", "Apply Now", "Order Now"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

HEADLINE="$1"
DESTINATION_URL="$2"
IMAGE_URL="${3:-https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200}"
CTA="${4:-Learn More}"

if [ -z "$HEADLINE" ] || [ -z "$DESTINATION_URL" ]; then
  echo "Usage: ./create-post.sh <headline> <destination_url> [image_url] [cta]"
  echo ""
  echo "Arguments:"
  echo "  headline        - Ad headline text"
  echo "  destination_url - Landing page URL (required for conversions!)"
  echo "  image_url       - URL to image asset (optional, uses stock image)"
  echo "  cta             - Call to action: 'Learn More', 'Sign Up', 'Shop Now' etc."
  echo ""
  echo "Example: ./create-post.sh 'Try AI Automation' 'https://www.agentss.ai' '' 'Learn More'"
  exit 1
fi

# Extract display URL from destination
DISPLAY_URL=$(echo "$DESTINATION_URL" | sed -e 's|https://||' -e 's|http://||' -e 's|www\.||' -e 's|/.*||')

echo "Creating Post..."
echo "  Headline: $HEADLINE"
echo "  Destination: $DESTINATION_URL"
echo "  Display URL: $DISPLAY_URL"
echo "  CTA: $CTA"
echo "  Profile ID: $REDDIT_PROFILE_ID"
echo ""

curl -s -X POST "$REDDIT_ADS_API/profiles/$REDDIT_PROFILE_ID/posts" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"headline\": \"$HEADLINE\",
      \"type\": \"IMAGE\",
      \"allow_comments\": false,
      \"content\": [{
        \"destination_url\": \"$DESTINATION_URL\",
        \"display_url\": \"$DISPLAY_URL\",
        \"call_to_action\": \"$CTA\",
        \"media_url\": \"$IMAGE_URL\"
      }]
    }
  }" | jq .
