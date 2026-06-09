# Bledom RGB Light Controller

## Pre-requisites
You need:
1. Python 3.12
2. NPM

## Setup
1. Open terminal
2. Click new terminal, you should have 2
3. In the 1st terminal, run:
```
cd frontend
npm install
```
4. In the 2nd terminal, run:
```
cd backend
pip install -r requirements.txt
```

## Running the application
Run <b>launch-app.bat</b> to start application

#### Manual approach (for development)
In the terminal at directory ./backend, run:
```
uvicorn main:app --host 0.0.0.0 --port 8000 --reload                                                    
```
In the terminal at directory ./frontend, run:
```
npm run dev                                                 
```

## Opening the application
When application is launched successfully, click on the VITE terminal link, 

or go to your browser and enter the link manually. 

The link should be <a href="http://localhost:5173">http://localhost:5173</a>
