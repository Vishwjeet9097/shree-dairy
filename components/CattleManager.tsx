
import React, { useState } from 'react';
import { InseminationRecord, Language } from '../types';
import { TEXTS } from '../constants';
import { Calendar as CalendarIcon, List, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

interface Props {
  inseminations: InseminationRecord[];
  language: Language;
  onAdd: (record: InseminationRecord) => void;
  onDelete: (id: string) => void;
}

const CattleManager: React.FC<Props> = ({ inseminations, language, onAdd, onDelete }) => {
  const t = TEXTS[language];
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !date) return;
      
      const newRecord: InseminationRecord = {
          id: Date.now().toString(),
          cowName: name,
          cowColor: color,
          inseminationDate: date,
          timestamp: Date.now()
      };
      
      onAdd(newRecord);
      setName('');
      setColor('');
      setShowForm(false);
  };

  const getExpectedDate = (dateStr: string) => {
      const d = new Date(dateStr);
      // Add ~283 days for gestation
      d.setDate(d.getDate() + 283);
      return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const getDaysPassed = (dateStr: string) => {
      const start = new Date(dateStr).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      return diff;
  };

  return (
    <div className="pb-24 animate-fade-in pt-4">
       
       <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-hindi">{t.cattle}</h2>
          <button 
             onClick={() => setShowForm(!showForm)}
             className="p-3 bg-lime-300 rounded-full shadow-lg text-gray-900 hover:scale-105 transition-transform"
          >
             <Plus size={24} />
          </button>
       </div>

       {/* Add Form */}
       {showForm && (
           <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm mb-6 animate-fade-in">
               <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{t.addCattle}</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                       <label className="text-xs text-gray-400 block mb-1 uppercase font-bold">{t.cowName}</label>
                       <input 
                         type="text" 
                         value={name}
                         onChange={e => setName(e.target.value)}
                         placeholder="e.g. Gauri"
                         className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-300"
                         required
                       />
                   </div>
                   <div>
                       <label className="text-xs text-gray-400 block mb-1 uppercase font-bold">{t.cowColor}</label>
                       <input 
                         type="text" 
                         value={color}
                         onChange={e => setColor(e.target.value)}
                         placeholder={t.cowColorPlaceholder}
                         className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-300"
                       />
                   </div>
                   <div>
                       <label className="text-xs text-gray-400 block mb-1 uppercase font-bold">{t.insemDate}</label>
                       <input 
                         type="date" 
                         value={date}
                         onChange={e => setDate(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-300"
                         required
                       />
                   </div>
                   <div className="flex gap-3 pt-2">
                       <button 
                         type="button" 
                         onClick={() => setShowForm(false)}
                         className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold"
                       >
                           {t.cancel}
                       </button>
                       <button 
                         type="submit" 
                         className="flex-1 py-3 rounded-xl bg-lime-400 text-gray-900 font-bold shadow-lg"
                       >
                           {t.save}
                       </button>
                   </div>
               </form>
           </div>
       )}

       {/* Tabs */}
       <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 transition-colors">
        <button 
          onClick={() => setViewMode('list')}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <List size={16} className="inline mr-1"/> {t.cattleList}
        </button>
        <button 
           onClick={() => setViewMode('calendar')}
           className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <CalendarIcon size={16} className="inline mr-1"/> {t.calendar}
        </button>
      </div>

      {inseminations.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem]">
              <p>{t.noCattle}</p>
          </div>
      ) : (
          <div className="space-y-4">
              {viewMode === 'list' ? (
                  inseminations
                    .sort((a,b) => new Date(b.inseminationDate).getTime() - new Date(a.inseminationDate).getTime())
                    .map(cow => {
                      const daysPassed = getDaysPassed(cow.inseminationDate);
                      const isNear = daysPassed > 270;
                      const isOverdue = daysPassed > 290;

                      return (
                          <div key={cow.id} className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm relative overflow-hidden group">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cow.cowName}</h3>
                                      {cow.cowColor && <p className="text-sm text-gray-400">{cow.cowColor}</p>}
                                  </div>
                                  <button 
                                     onClick={() => { if(window.confirm(t.confirmDeleteCattle)) onDelete(cow.id) }}
                                     className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                              
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                      <span className="text-xs text-gray-400 block uppercase font-bold">{t.insemDate}</span>
                                      <span className="font-bold text-gray-800 dark:text-gray-200">{cow.inseminationDate}</span>
                                  </div>
                                  <div>
                                      <span className="text-xs text-gray-400 block uppercase font-bold">{t.daysPassed}</span>
                                      <span className="font-bold text-gray-800 dark:text-gray-200">{daysPassed} days</span>
                                  </div>
                              </div>

                              <div className={`p-3 rounded-xl flex items-center gap-3 ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : isNear ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300'}`}>
                                  {isOverdue ? <Clock size={20} /> : <CheckCircle size={20} />}
                                  <div>
                                      <span className="text-xs opacity-70 block uppercase font-bold">{t.expectedDate}</span>
                                      <span className="font-bold text-lg">{getExpectedDate(cow.inseminationDate)}</span>
                                  </div>
                              </div>
                          </div>
                      );
                  })
              ) : (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm">
                      {/* Simple Calendar List View logic for now */}
                      <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Recent Activities</h3>
                      {inseminations.map(cow => (
                          <div key={cow.id} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                              <div className="w-12 h-12 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center text-lime-600 dark:text-lime-400 font-bold text-sm">
                                  {new Date(cow.inseminationDate).getDate()}
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{cow.cowName}</p>
                                  <p className="text-xs text-gray-400">Inseminated on {cow.inseminationDate}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default CattleManager;
