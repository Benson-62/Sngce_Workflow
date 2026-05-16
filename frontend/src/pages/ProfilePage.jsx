import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
    const [role, setRole] = useState();
    const [email, setEmail] = useState();
    const [department, setDepartment] = useState()
    useEffect(() => {
        const tokenStr = localStorage.getItem('token');
        if (!tokenStr) return;
        
        const decoded = jwtDecode(tokenStr);
        const userEmail = decoded.email;
        
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`/api/user/profile/${userEmail}`);
                setRole(res.data.role);
                setEmail(res.data.email);
                setDepartment(res.data.department);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                // Fallback to token if backend fails
                setRole(decoded.role);
                setEmail(decoded.email);
                setDepartment(decoded.department);
            }
        };

        fetchProfile();
    }, []);

 
  return (
    <div className="profile-container">
      <h2>Profile</h2>
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
