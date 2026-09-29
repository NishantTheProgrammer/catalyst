import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

type ChartsProps = {
  qualityDistribution: { name: string; value: number }[];
  qualityMetrics: { metric: string; score: number }[];
  categoryData: { name: string; value: number }[];
  categories: string[];
  trendData: any[];
  selectedQuality: string | null;
  setSelectedQuality: (q: string | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  colors: string[];
};

export default function Charts({
  qualityDistribution,
  qualityMetrics,
  categoryData,
  categories,
  trendData,
  selectedQuality,
  setSelectedQuality,
  selectedCategory,
  setSelectedCategory,
  colors
}: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in animate-delay-2 mt-4">
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Quality Distribution</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qualityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {qualityDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    cursor="pointer"
                    fill="#10b981"
                    onClick={() => setSelectedQuality(selectedQuality === entry.name ? null : entry.name)}
                    style={{ opacity: selectedQuality && selectedQuality !== entry.name ? 0.3 : 1, transition: 'opacity 300ms' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Criteria Averages (out of 100)</h3>
        <div className="h-[250px] w-full">
          {qualityMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qualityMetrics}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Waiting for data...
            </div>
          )}
        </div>
      </div>
      
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Defect Breakdown</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                    onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
                    className="cursor-pointer transition-opacity duration-300 hover:opacity-80"
                    style={{ opacity: selectedCategory && selectedCategory !== entry.name ? 0.3 : 1 }}
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {categoryData.map((entry, index) => (
            <div 
              key={entry.name} 
              onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
              className={`flex items-center gap-2 text-xs cursor-pointer transition-all ${
                selectedCategory && selectedCategory !== entry.name ? 'opacity-30' : 'opacity-100 hover:text-white'
              } ${!selectedCategory ? 'text-muted-foreground' : ''}`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
              {entry.name} ({entry.value})
            </div>
          ))}
        </div>
      </div>
      
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Defects Over Time</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              {categories.map((category, index) => (
                <Bar 
                  key={category}
                  dataKey={category} 
                  name={category}
                  stackId="a"
                  fill={colors[index % colors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
