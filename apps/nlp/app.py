from flask import Flask, request, jsonify
import spacy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

@app.route('/health-check', methods=['GET'])
def health_check():
   return 'OK'

@app.route('/ner', methods=['POST'])
def perform_ner():
   doc = nlp(request.json['text'])

   result = []

   # Named entities
   for ent in doc.ents:
       result.append({
           'text': ent.text,
           'label': ent.label_
       })

   # Other meaningful tokens
   for token in doc:
       if not token.is_stop and not token.is_punct and token.pos_ in ['NOUN', 'PROPN', 'ADJ']:
           result.append({
               'text': token.text,
               'label': token.pos_
           })

   return jsonify(result)
