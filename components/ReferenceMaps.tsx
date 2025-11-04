import React, { useState, useEffect } from 'react';

interface DataLayersProps {
    coords: { lat: number; lon: number } | null;
}

const solarLayer = {
    key: 'solar',
    title: "Solar Irradiance (GHI)",
    description: "Higher values (red/orange) indicate greater solar energy potential.",
    imageUrl: 'https://www.nrel.gov/docs/libraries/gis/high-res-images/nsrdb-v3-ghi-2018-01.jpg?sfvrsn=855ad6e1_1',
};

const windLayer = {
    key: 'wind',
    title: "Wind Map (Live)",
    description: "Real-time wind and weather map to assess wind potential.",
};

const ReferenceMaps: React.FC<DataLayersProps> = ({ coords }) => {
    const [activeTab, setActiveTab] = useState('solar');
    // Default to a central US location, zoom level 3. Switched to Windy.com for reliable embedding.
    const [windyUrl, setWindyUrl] = useState('https://embed.windy.com/embed.html?lat=39.8283&lon=-98.5795&zoom=3&level=surface&overlay=wind&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1');

    useEffect(() => {
        if (coords?.lat && coords?.lon) {
            // Update the iframe URL when the user selects a location on the main map, zoom in closer
            setWindyUrl(`https://embed.windy.com/embed.html?lat=${coords.lat}&lon=${coords.lon}&zoom=10&level=surface&overlay=wind&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`);
        }
    }, [coords]);

    const tabs = [solarLayer, windLayer];

    return (
        <>
            <div className="mb-4 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`${
                                activeTab === tab.key
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                        >
                            {tab.title}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'solar' && (
                    <div className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-slate-200 dark:bg-slate-700 overflow-hidden flex flex-col">
                        <div className="text-center p-2 bg-slate-100 dark:bg-slate-700/50">
                            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{solarLayer.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{solarLayer.description}</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-800">
                            <img src={solarLayer.imageUrl} alt={solarLayer.title} className="w-full h-auto object-contain" loading="lazy" />
                        </div>
                    </div>
                )}
                {activeTab === 'wind' && (
                     <div className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-slate-200 dark:bg-slate-700 overflow-hidden flex flex-col">
                        <div className="text-center p-2 bg-slate-100 dark:bg-slate-700/50">
                            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{windLayer.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{windLayer.description}</p>
                        </div>
                        <div className="w-full h-96 bg-white dark:bg-slate-800">
                             <iframe
                                title="Windy.com Map"
                                width="100%"
                                height="100%"
                                src={windyUrl}
                                frameBorder="0"
                                allowFullScreen
                                loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ReferenceMaps;