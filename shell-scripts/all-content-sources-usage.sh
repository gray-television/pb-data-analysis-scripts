#!/bin/bash

# Get the options
Csv=False
while getopts ":hn:c" option; do
  case $option in
    c) # CSV output
      Csv=True;;
    h) # Help message
      echo "Usage: $0 [-c]"
      echo "  -c for CSV output you can pipe to a file"
      exit 0;;
    \?) # Invalid option
      echo "Error: Invalid option"
      exit 1;;
  esac
done

QUERY="SELECT * FROM (
  SELECT
    featureName,
    contentService,
    COUNT(DISTINCT pageOrTemplateId) as countOfPagesOrTemplatesUsing
  FROM view_rendering
  INNER JOIN view_page_and_template ON view_page_and_template.published = view_rendering.renderingVersionId
    AND contentService != ''
  WHERE pageOrTemplateId IS NOT NULL
  GROUP BY contentService, featureName
)
ORDER BY countOfPagesOrTemplatesUsing DESC"

if [[ $Csv == "True" ]]; then
  QUERY="COPY ($QUERY) TO STDOUT WITH (FORMAT CSV, HEADER);"
else
  # Print the header
  YELLOW='\033[0;33m'
  RESET='\033[0m'
  echo "${YELLOW}\n--- Content sources in feature configuration is pages and templates ---\n${RESET}"
fi

duckdb _tmpview.db "$QUERY"
