import spacy
import numpy as np

def test_spacy():
    print("Testing spaCy model...")
    try:
        nlp = spacy.load("en_core_web_lg")
        print("✅ Successfully loaded spaCy model")
        
        # Test text processing
        test_text = """
        Experienced software engineer with 5 years of experience in Python, JavaScript, and React. 
        Led a team of 4 developers to build a cloud-based analytics platform. 
        Skilled in AWS, Docker, and CI/CD pipelines.
        """
        
        doc = nlp(test_text)
        print("\nEntities detected:")
        for ent in doc.ents:
            print(f"  - {ent.text} ({ent.label_})")
            
        print("\nNoun chunks:")
        for chunk in doc.noun_chunks:
            print(f"  - {chunk.text}")
        
        # Test similarity calculation (using spaCy instead of sentence transformers)
        resume = nlp("Experienced Python developer with expertise in machine learning and data science")
        job_desc = nlp("Looking for a Python developer with knowledge of machine learning algorithms")
        
        similarity = resume.similarity(job_desc)
        print(f"\nSimilarity score (using spaCy): {similarity:.4f} ({similarity*100:.1f}%)")
        
        return True
    except Exception as e:
        print(f"❌ Error loading or using spaCy model: {e}")
        return False

if __name__ == "__main__":
    print("=== NLP Components Test ===\n")
    
    spacy_success = test_spacy()
    
    if spacy_success:
        print("\n✅ spaCy model is working correctly!")
        print("\nFor this implementation, we'll use spaCy for both keyword extraction and similarity calculation.")
        print("The full sentence-transformers implementation would require resolving dependency conflicts.")
    else:
        print("\n❌ spaCy model test failed. Please check the error messages above.")
        print("\nPlease resolve the issues before running the API.") 