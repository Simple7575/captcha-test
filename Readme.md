To use this repo first got to [this website](https://www.assemblyai.com/app "AssemblyAI") and make API key to use speech to text AI.

Make <mark>.env</mark> file and add your api key to it

```.env
ASSEMBLY_AI_KEY=<your-api-key-here>
```

Run this command to start local server to handle requests and responses to AI api

```cmd
npm run dev
```

Then run next command to start wdio

```cmd
npm run wdio
```
