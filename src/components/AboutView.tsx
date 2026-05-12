import React from 'react';

const AboutView: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto transform transition-all hover:shadow-2xl hover:-translate-y-1">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4 transition-colors hover:text-blue-600">About Touch Up</h1>
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p className="transition-colors hover:text-gray-900">
          Welcome to Touch Up, your number one source for pure, refreshing water, delivered right to your doorstep. We're dedicated to giving you the very best of hydration, with a focus on dependability, customer service, and quality.
        </p>
        <p className="transition-colors hover:text-gray-900">
          Founded in 2023, Touch Up has come a long way from its beginnings. When we first started out, our passion for providing clean and accessible water for everyone drove us to do intense research, and gave us the impetus to turn hard work and inspiration into a booming online store. We now serve customers all over the city, and are thrilled to be a part of the healthy hydration wing of the beverage industry.
        </p>
        <p className="transition-colors hover:text-gray-900">
          We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions or comments, please don't hesitate to contact us.
        </p>
      </div>
    </div>
  );
};

export default AboutView;
