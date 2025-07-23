import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import './ProfilePage.css';

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
    <div className="profile-container">
      <h2>Profile Page</h2>
      <div className="profile-card">
        <div className="profile-avatar">
          {email ? email.charAt(0).toUpperCase() : <span>👤</span>}
        </div>
        <div className="profile-details">
          <div className="profile-label">Email:</div>
          <div className="profile-value">{email}</div>
          <div className="profile-label">Role:</div>
          <div className="profile-value">{role}</div>

          {/* ✅ Conditionally render Department */}
          {!['admin', 'principal', 'manager'].includes(role?.toLowerCase()) && (
            <>
              <div className="profile-label">Department:</div>
              <div className="profile-value">{department}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
