const HtmlTableToJson = require('html-table-to-json');
const fs = require('fs')

const urlInput = 'https://docs.google.com/document/d/e/2PACX-1vSHesOf9hv2sPOntssYrEdubmMQm8lwjfwv6NPjjmIRYs_FOYXtqrYgjh85jBUebK9swPXh_a5TJ5Kl/pub'

const streamToString = async (stream) => {
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf-8");
}

const cleanText = txt => {
    const startOfDataIndex = txt.search('table class=') - 1
    const endOfDataIndex = txt.search('\/table') + 7
    const cleaned =  txt.slice(startOfDataIndex, endOfDataIndex)
    const dataAsJson = HtmlTableToJson.parse(cleaned).results
    return dataAsJson
}

const sortDataAsJson = jasonArr => {
    return jasonArr.sort((a, b) => {
            const sortedX = parseInt(a['x-coordinate']) - parseInt(b['x-coordinate'])
            const sortedY = parseInt(b['y-coordinate']) - parseInt(a['y-coordinate'])
            if (sortedY !== 0) {
                return sortedY
            } else {
                return sortedX
            }
        })
}

const getDoc = async (url) => {
    const docTxtResponse = await fetch(url)
    const result = await streamToString(docTxtResponse.body)
    const data = cleanText(result)
    const sortedData = sortDataAsJson(data[0])
    const decoded = buildSecretMessage(sortedData)
    fs.writeFileSync("message.txt", decoded)
    return decoded
}

const buildSecretMessage = (sortedJson) => {
    let secretMessage = ``
    let previousYindex = parseInt(sortedJson[0]['y-coordinate'])
    console.log(previousYindex)
    let xCount = 0
    for(i = 0; i < sortedJson.length; i+=1) {
        if(previousYindex > sortedJson[i]['y-coordinate']) {
            console.log('newline')
            secretMessage += `\/r\/n`
            secretMessage += sortedJson[i]['Character']
            previousYindex -= 1
            xCount = 1
        } else {
            if(xCount < sortedJson[i]['x-coordinate']) {
                while(xCount < sortedJson[i]['x-coordinate']) {
                    console.log('x mis match', xCount, sortedJson[i]['x-coordinate'])
                    secretMessage += ' '
                    xCount +=1
                }
            }
            console.log('x match')
            secretMessage += sortedJson[i]['Character']
            xCount += 1
        }
    }
    return secretMessage
}


getDoc(urlInput)