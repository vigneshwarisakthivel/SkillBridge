import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import './styles.css';

function App() {
  const [selectedEmail, setSelectedEmail] = useState(null);

  const emails = [
    { id: 1, sender: 'Hannah Morgan', subject: 'Meeting scheduled', body: 'Hi James, I just scheduled a meeting...', time: '1:24 PM' },
    { id: 2, sender: 'Megan Clark', subject: 'Update on marketing campaign', body: 'Hey Richard, here’s an update on...', time: '12:32 PM' },
    // Add more emails here...
  ];

  return (
    <div className="app">
      <Sidebar />
      <EmailList emails={emails} onSelectEmail={setSelectedEmail} />
      <EmailDetail email={selectedEmail} />
    </div>
  );
}

export default App;
