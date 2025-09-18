# Notion Integration Setup Guide

## Prerequisites

Before you can use the Notion Reading List extension, you need to set up a Notion integration and database.

## Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give your integration a name (e.g., "Reading List Extension")
4. Select the workspace where you want to store your bookmarks
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (starts with `secret_`) - you'll need this as your API key

## Step 2: Create a Notion Database

1. Create a new page in Notion or use an existing one
2. Add a database (table) to the page with the following properties:
   - **Name** (Title) - for the bookmark title
   - **URL** (URL) - for the website link
   - **Notes** (Text) - for additional notes about the bookmark
3. Share the database with your integration:
   - Click the **"Share"** button on your database page
   - Click **"Invite"** and select your integration
   - Give it **Edit** permissions

## Step 3: Get Your Database ID

1. Open your database page in Notion
2. Copy the URL from your browser
3. The Database ID is the 32-character string in the URL between the workspace name and the `?v=`
   - Example URL: `https://www.notion.so/workspace/12345678901234567890123456789012?v=...`
   - Database ID: `12345678901234567890123456789012`

## Step 4: Configure the Extension

1. Click the extension icon in your browser toolbar
2. Enter your **Notion API Key** (the integration token from Step 1)
3. Enter your **Database ID** (from Step 3)
4. Click **"Save & Test"** to verify the connection

## Step 5: Start Saving Bookmarks!

Once configured, you can:
- Navigate to any webpage
- Click the extension icon
- Optionally customize the title and add notes
- Click **"Save to Notion"** to add the bookmark to your database

## Troubleshooting

### "Connection failed" error
- Verify your API key is correct and starts with `secret_`
- Ensure your Database ID is exactly 32 characters
- Make sure you've shared the database with your integration

### "Failed to save" error
- Check that your database has the required properties: Name (Title), URL (URL), and Notes (Text)
- Verify the integration has Edit permissions on the database

### No URL detected
- Make sure you're on a valid webpage (not a browser settings page or extension page)
- The extension needs to be properly installed and have permissions to access the current tab