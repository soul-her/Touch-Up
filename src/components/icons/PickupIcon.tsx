import React from 'react';

const PickupIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
       <circle cx="12" cy="12" r="9"></circle>
       <line x1="9" y1="12" x2="15" y2="12"></line>
       <line x1="9" y1="12" x2="12" y2="9"></line>
       <line x1="9" y1="12" x2="12" y2="15"></line>
    </svg>
);

export default PickupIcon;
