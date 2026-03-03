import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  image: string;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, image, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left Panel: Image */}
      <div className="relative hidden w-1/2 lg:block">
        <img
          src={image}
          alt="Luxury Jewelry"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center text-white">
          <h1 className="font-serif text-6xl font-bold leading-tight drop-shadow-2xl">{title}</h1>
          <p className="mt-4 max-w-md text-xl font-medium drop-shadow-lg opacity-90">{subtitle}</p>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="flex h-full w-full flex-col justify-center px-5 py-5 md:px-10 md:py-6 lg:w-1/2 lg:px-16 lg:py-8">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
