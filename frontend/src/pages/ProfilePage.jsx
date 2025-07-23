import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';

const ProfilePage = () => {
    const [role, setRole] = useState();
    const [email, setEmail] = useState();
    const [department, setDepartment] = useState()
    useEffect(()=>{
        var token = jwtDecode(localStorage.getItem('token'));
        setRole(token.role)
        setEmail(token.email)
        setDepartment(token.department)
        console.log(token)  
    })

 
  return (
    <div style={styles.container}>
      <h2>Profile Page</h2>
      <div style={styles.card}>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Role:</strong> {role}</p>
        <p><strong>Department:</strong> {department}</p>
      </div>
    </div>
  );
};

// Inline styles (can be moved to CSS)
const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }
};


export default ProfilePage;
