curl -X GET "https://circleci.com/api/v2/project/github/player-ui/player/$CIRCLE_BUILD_NUMBER/artifacts" \
      -H "Accept: application/json" \
      -u "$CIRCLE_API_TOKEN:"