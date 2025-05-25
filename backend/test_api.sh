#!/bin/bash

echo "===== PDF Extraction Test ====="
python test_extraction.py
echo ""

echo "===== NLP/AI Processing Test ====="
python test_analyze.py
echo ""

echo "===== API Endpoint Test ====="
python test_api.py
echo ""

echo "===== Additional Debug Tips ====="
echo "1. Check if 'use_mock_data' is set to 'true' in browser localStorage"
echo "2. Try clearing browser cache and localStorage"
echo "3. Check browser network tab for specific API errors"
echo "4. Check server logs for detailed error information" 