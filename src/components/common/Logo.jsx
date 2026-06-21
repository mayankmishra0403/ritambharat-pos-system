const Logo = ({ className = "w-auto h-10" }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <img
                src="/logo.png"
                alt="Ritam Bharat POS"
                className="h-full w-auto object-contain"
            />
        </div>
    );
};

export default Logo;
