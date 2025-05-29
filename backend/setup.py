import subprocess
import sys

def install_dependencies():
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)

def download_spacy_model():
    print("Downloading spaCy model...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        print("spaCy model downloaded successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error downloading spaCy model: {e}")
        sys.exit(1)

if __name__ == "__main__":
    install_dependencies()
    download_spacy_model()
    print("\nSetup complete! You can now run the API with: python run_api.py") 