from huggingface_hub import login
import getpass

print("Please enter your Hugging Face token (create one at https://huggingface.co/settings/tokens):")
token = getpass.getpass()
login(token=token)
print("Login successful. You can now use Hugging Face models.") 