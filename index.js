// import openAI
import OpenAI from "openai";

// set up the client
const client = new OpenAI({
    // for running ONLY local test, put your openAI API key here and set dangerouslyAllowBrowser to true
    apiKey: 'yourKeyHere',
    dangerouslyAllowBrowser: true // only use this if testing locally! This exposes your API key!

    // for deploying properly, use your .env to load your API key or load it from a backend
    // apiKey = process.env.OPENAI_API_KEY
});

// UI elements we'll be using
const textarea = document.getElementById("textToTranslate");
const instructionHeader = document.getElementById("instructionHeader");
const languageHeader = document.getElementById("languageHeader");
const translateButton = document.getElementById("translate-btn");
const languageForm = document.getElementById("languageForm");
const outputBox = document.getElementById('outputBox');
const spinner = document.getElementById('spinner')

// variables to track
let doneTranslating = false;
let userTextInput = "";


// our main ai request function
async function fetchTranslation(userInput, targetLanguage) { // takes our user input and target language as parameters
    // our messages object with system and user roles
    const messages = [
        {
            role: 'system',
            content: `
                You are a language expert fluent in English, Spanish, French, and Japanese. You ONLY translate text between English, Spanish, French, and Japanese. 
                Never output anything else besides translations. Given a sentence in english you will translate to the target language given by the user. 
                If the user inputs a sentence you can't understand then reply with 'I'm sorry I don't understand'
            `
        },
        {
            role: 'user',
            content: `Translate the following sentence into ${targetLanguage}: ${userInput}`
        }
    ]
    // try catch for getting our response, using gpt-5-nano as its the cheapest model available right now
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-5-nano',
            messages: messages,
            temperature: 1.0,
            max_completion_tokens: 300 // can't imagine we'll exceed this num of tokens with only 100 characters allowed to be input
            // presence_penalty: 0, // not really necessary for translation imo
            // frequency_penalty: 0, // not really necessary for translation imo
        })
        // console.log(response.choices[0].message.content); // checking the response
        return response.choices[0].message.content;
    } catch (error) {
        console.log('Error:', error);
        outputBox.innerText = "Unable to access AI. Please refresh and try again";
    };
}

// checking that our language form selection is working
languageForm.addEventListener('change', (event) => {
    if (event.target.name === 'language') {
      console.log('Selected language:', event.target.value);
    }
});

// main button function to translate <-> reset
translateButton.addEventListener('click', (event) => {
    if(!doneTranslating) {
        userTextInput = textarea.value
        translate();
    } else {
        resetUI();
    }
})

// main function
async function translate() {
    // check we have something to translate and a target language
    if (userTextInput === '' || userTextInput === null || userTextInput === undefined) {
        console.log('nothing to translate');
        alert('please input something to translate');
        return;
    }
    // check if we have a target translation
    const selectedLanguage = document.querySelector('input[name="language"]:checked')?.value;
    if (!selectedLanguage) {
        console.log('no language selected');
        alert('please select a language');
        return;
    }

    // 'sanitize' our input
    const cleanedText = sanitizeInput(userTextInput);

    // load up the spinner, hide the language form, and disable the button
    spinner.classList.remove('hidden');
    languageForm.classList.add('hidden');
    translateButton.disabled = true;

    // translate here by passing our cleaned text and target language
    const translation = await fetchTranslation(cleanedText, selectedLanguage);

    // UI feedback here
    translateButton.innerText = "Start Over";
    translateButton.disabled = false;
    instructionHeader.innerHTML = "Original Text &#128071;";
    languageHeader.innerHTML = "Your Translation &#128071;";
    spinner.classList.add('hidden');
    outputBox.classList.remove('hidden');

    // set the values
    textarea.value = userTextInput;
    outputBox.innerText = translation;

    // flip the switch for resetting
    doneTranslating = true;
}

// reset function
function resetUI() {
    // reset all the UI and values
    translateButton.innerText = "Translate";
    instructionHeader.innerHTML = "Text to translate &#128071;";
    languageHeader.innerHTML = "Select Language &#128071;";
    languageForm.classList.remove('hidden');
    outputBox.classList.add('hidden');
    spinner.classList.add('hidden');
    textarea.value = '';
    userTextInput = ''
    
    // flip the switch
    doneTranslating = false;
}

// function to prevent users to inject markup, scripts, or html into the page
function sanitizeInput(text) {
    const div = document.createElement("div");
    div.textContent = text;
    console.log(div.innerHTML); // just checking we got the right text
    return div.innerHTML;
}