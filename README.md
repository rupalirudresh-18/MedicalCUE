# MedicalCUE

MedicalCUE is an AI-powered health information web application that helps users search diseases in simple language, even when the query contains short forms, spelling mistakes, or non-exact terms. It provides disease symptom-based understanding, useful health information, and an AI Q&A experience.

## Live Demo

🔗 **Frontend:** https://medical-cue.onrender.com 
🔗 **Backend API:** https://medicalcue-3.onrender.com

## Overview

MedicalCUE was built to make disease-related information easier to search and understand for general users. Instead of requiring exact medical terms, the system accepts natural user search queries and maps them to the most relevant disease using a trained normalization model. After identifying the disease, the application returns structured medical content such as overview, symptoms, home remedies, precautions, and guidance on when to consult a doctor.

The project also includes an AI-powered Q&A feature that allows users to ask health-related questions in a more conversational way. The goal is to create an accessible, educational, and user-friendly medical information platform.

## Features

- Smart disease search from natural language queries
- Handles misspellings, short words, and approximate disease names
- Disease normalization using a trained machine learning model - Logistic Regression
- Cosine Similarity for recommendation
- Disease detail view with summary and important health information
- AI Q&A feature for interactive health-related queries
- Educational disclaimer for safe usage

## Dataset

This project uses two main CSV files for data storage and model training:

### `diseases.csv`
This file contains the core disease knowledge base used by the application. It stores structured information for each disease, such as:
- disease name
- overview
- symptoms
- home remedies
- precautions
- when to see a doctor

This dataset powers the result display shown to users after a disease is identified.

### `disease_queries.csv`
This file contains search query variations mapped to disease names. It was created to help train the disease normalization model so that the app can understand:
- spelling mistakes
- short forms
- alternate wording
- informal or partial disease search queries

This dataset is important because users often do not type the exact medical term. The model learns these variations and predicts the most relevant disease name.

## Machine Learning Pipeline

MedicalCUE uses two training scripts to support intelligent disease retrieval.

### 1. Query Normalization Model

File: `train_normalize.py`

This script trains a machine learning pipeline that converts user search queries into the correct disease label.

#### How it works
- Loads data from `diseases.csv` and `disease_queries.csv`
- Takes the `query` column as input
- Takes the `disease_name` column as output label
- Uses `TfidfVectorizer` with character-level n-grams
- Uses `LogisticRegression` as the classifier
- Saves the trained model as `normalizer.joblib`
- Saves a disease lookup index as `disease_index.joblib`

#### Why this is useful
Character-level TF-IDF helps the system understand:
- misspellings
- similar spellings
- short incomplete disease names
- user-entered variations

This makes the search much more robust than exact keyword matching.

### 2. Disease Recommendation / Similarity Model

File: `train_recommender.py`

This script creates a similarity-based recommendation layer using disease content.

#### How it works
- Loads disease data from `diseases.csv`
- Combines fields like overview, symptoms, home remedies, precautions, and when to see doctor
- Converts combined text into TF-IDF vectors
- Computes cosine similarity between diseases
- Saves processed disease data as `recommender_df.joblib`
- Saves similarity scores as `similarity_matrix.joblib`

#### Why this is useful
This model helps the system understand how diseases are textually related based on their medical descriptions and symptoms. It can be used for similarity-based recommendations or related-disease exploration.

## Tech Stack

### Frontend
- React
- Vite
- CSS
- Render Static Site deployment

### Backend
- FastAPI
- Python
- Pandas
- Scikit-learn
- Joblib
- Render Web Service deployment

### ML / Data
- TF-IDF Vectorization
- Logistic Regression
- Cosine Similarity
- CSV-based disease datasets

## Project Structure

```bash
MedicalCUE/
│
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   ├── diseases.csv
│   │   │   └── disease_queries.csv
│   │   ├── models/
│   │   │   ├── normalizer.joblib
│   │   │   ├── disease_index.joblib
│   │   │   ├── recommender_df.joblib
│   │   │   └── similarity_matrix.joblib
│   │   └── main.py
│   └── training/
│       ├── train_normalize.py
│       └── train_recommender.py
│
├── frontend/
│   ├── src/
│   └── public/
│
└── README.md
```

## How Search Works

1. The user enters a disease-related query in the frontend.
2. The backend sends the query to the normalization model.
3. The trained model predicts the closest disease name.
4. The app fetches the full disease information from the indexed dataset.
5. The frontend displays the result in a clean and readable format.
6. The AI Q&A feature allows users to ask follow-up health-related questions.

## Installation

### Clone the repository

```bash
git clone https://github.com/rupalirudresh-18/MedicalCUE.git
cd MedicalCUE
```

### Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Model Training

Run these scripts if you want to retrain the models:

### Train normalization model
```bash
python training/train_normalize.py
```

### Train recommendation model
```bash
python training/train_recommender.py
```


## Future Enhancements

- Disease recommendation based on symptoms
- Multilingual support
- Improved personalization and health education features
