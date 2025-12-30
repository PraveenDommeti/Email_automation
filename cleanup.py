import os
import shutil

files = ["app.py", "mail.py", "verify.py", "sent_emails.txt", "test_campaign.csv", "test_emails.csv", "requirements.txt"]
dirs = ["templates", "static", "uploads"]

print("Starting cleanup...")
for f in files:
    try:
        path = os.path.join(os.getcwd(), f)
        if os.path.exists(path):
            os.remove(path)
            print(f"Deleted {f}")
        else:
            print(f"{f} not found")
    except Exception as e:
        print(f"Error deleting {f}: {e}")

for d in dirs:
    try:
        path = os.path.join(os.getcwd(), d)
        if os.path.exists(path):
            shutil.rmtree(path)
            print(f"Deleted directory {d}")
        else:
            print(f"{d} not found")
    except Exception as e:
        print(f"Error deleting {d}: {e}")

print("Cleanup complete.")
