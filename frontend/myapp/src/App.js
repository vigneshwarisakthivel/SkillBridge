import React from 'react';
import './App.css'; // Optional: Custom styles for the entire app
import Register from './Register'; // Import the Register component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to the Quiz Website</h1>
      </header>
      <main>
        <Register /> {/* Render the Register component */}
      </main>
    </div>
  );
}

export default App;
