'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

exports.handler = async(event) => {
    
    var eventDetail = event.detail;
    var jsonObj;

    console.log('Initializing authentication tokens');
    
    jsonObj = JSON.parse(fs.readFileSync(__dirname + '/config.json','utf-8'));

    let supportAuth = Buffer.from(jsonObj.supportAdmin + '/token:' + jsonObj.supportToken).toString('base64'); // create basic auth for Support
    var supportDomain = jsonObj.supportDomain;

    /*Create Sunco Auth*/

    var suncoKeyId = jsonObj.suncoKeyId;
    var suncoSecret = jsonObj.suncoSecret;

    var suncoToken = signJwt(suncoKeyId, suncoSecret);

    //Handles Ticket Creation
    if (eventDetail.ticket_event.type == 'Ticket Created') {
        console.log('Ticket Created');

        //Get Chat Audits from Support API
        
        let options = {
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'Basic ' + supportAuth  
            }
        };

        let requestPath = 'https://' + supportDomain + '.zendesk.com/api/v2/tickets/' + eventDetail.ticket_event.ticket.id + '/audits.json';

        let resp = await axios.get(requestPath, options);

        //Handle Chat Start Event
        
        let chatEvents = resp.data.audits[0].events;
        
        let chatStartedEvent = chatEvents.find(event => event.type == 'ChatStartedEvent');
        
        let visitorId = chatStartedEvent.value.visitor_id;
        
        //Get Chat External ID from Chat API
        
        options = {
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'Bearer ' + jsonObj.chatToken
            }
        };

        requestPath = 'https://www.zopim.com/api/v2/visitors/' + visitorId;

        resp = await axios.get(requestPath, options);
        
        let externalId = resp.data.external_id;
        
        let suncoIds = externalId.split('_');
        
        let appId = suncoIds[0];
        let appUserId = suncoIds[1];
        let conversationId = suncoIds[2];
        
        //Get Conversation Metadata from Sunco
        
       options = {
            headers: {
                'Content-type': 'application/json',
                'Authorization': 'Bearer ' + suncoToken
            }
        };

        requestPath = 'https://api.smooch.io/v2/apps/' + appId + '/conversations/' + conversationId;

        resp = await axios.get(requestPath, options);
        
        let convoMetadata = resp.data.conversation.metadata;
        let ticketTags = [];
        let ticketCustomFields = [];
        
        
        /* starts only if there's metadata */
        if (convoMetadata){
            
            console.log('Starting ticket enrichment')
            
            /* insert here any logic to bring context and populate custom fields and tags if needed */
            
            switch(convoMetadata.reason){
                case 1:
                    
                    console.log('Problems with an order');
                    
                    ticketTags = ["problema_pedido"];
                    
                    ticketCustomFields = [
                        {
                            "id": 360035932592,
                            "value": convoMetadata.orderNumber
                        }
                        ]
                        
                    break;
                    
                case 2:
                    ticketTags = ["problemas_técnicos"];
                    
                    break;
                    
            }
            
            // call Support API to update ticket
            
             options = {
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': 'Basic Z2FicmllbC5vbGl2ZWlyYUB6ZW5kZXNrLmNvbTpzdGVsbGExNw=='   //Change the authorization here
                }
            };
            
            //set custom fields, tags and ticket External Id as the ConversationId
            
            let data = {
                ticket: {
                    custom_fields: ticketCustomFields,
                    tags: ticketTags,
                    external_id: conversationId
                }
            
            }
            
            console.log(data)
    
            let requestPath = 'https://' + supportDomain + '.zendesk.com/api/v2/tickets/' + eventDetail.ticket_event.ticket.id + '.json';
    
            resp = await axios.put(requestPath, data, options);
            
            console.log(resp.data)
        }
        
        
        const response = {
            statusCode: 200,
            body: JSON.stringify({status:'Success'}),
        };
        return response;
    };
}

var signJwt = function (suncoKeyId,suncoSecret) {
        return jwt.sign(
            {
                scope: 'app'
            },
            suncoSecret,
            {
                header: {
                    alg: 'HS256',
                    typ: 'JWT',
                    kid: suncoKeyId
                }
            }
        );
    };