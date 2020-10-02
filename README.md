# Agent Workspace Ticket Manager

The main purpose of this project is to help bringing context collected on Sunshine Conversations metadata to an open ticket on Agent Workspace.

## Requirements

1. Zendesk Suite account with Agent Workspace and AWS Events Connector enabled
1. Zendesk Sunshine Conversations account connected to Support
1. Conversation context stored on `metadata` object on Sunshine Conversations
1. Sunshine Conversations v2 API

**What if I don't have Events Connector?** You can still use this code, as the most important steps for retrieving Sunshine Conversations info from a Chat are still usable. However, you'd have to expose this code to an endpoint and [call it from a trigger](https://support.zendesk.com/hc/en-us/articles/203662136-Notifying-external-targets) on Zendesk Support

## Authorization

* **Support**: Generate a new API token as explained on [this link](https://support.zendesk.com/hc/en-us/articles/226022787-Generating-a-new-API-token-)
* **Chat**: Generate a Bearer token as explaind on [this link](https://support.zendesk.com/hc/en-us/articles/115010760808-Chat-API-tutorial-Generating-an-OAuth-token-integrated-Chat-accounts-)
* **Sunshine Conversations**: Obtain your app Key ID and Secret from your Sunshine Conversations Account Dashboard

## Installation

1. Set up a Lambda function with `index.js` and all pre-installed modules
1. Set up all authentications on `config.json``
1. Implement your logic after obtaining metadata from Sunshine Conversations. You can leverage all [Zendesk Support Update Ticket API](https://developer.zendesk.com/rest_api/docs/support/tickets#update-ticket) for this
1. Set up [AWS Events Connector](https://support.zendesk.com/hc/en-us/articles/360043496933-Setting-up-the-events-connector-for-Amazon-EventBridge#:~:text=Go%20to%20your%20Zendesk%20Admin,Web%20Services%20account%20ID%20field.) and ticket events
