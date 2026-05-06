
import React, { useState, useEffect } from 'react';
import { ContactLink } from '../../types';
import { supabaseService } from '../../supabase';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSupportProps {
  addLog: (msg: string) => void;
}

const AdminSupport: React.FC<AdminSupportProps> = ({ addLog }) => {
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<Partial<ContactLink> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    const data = await supabaseService.getContactLinks();
    setLinks(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink?.name || !editingLink?.url) return;

    const linkToSave: ContactLink = {
      id: editingLink.id || crypto.randomUUID(),
      name: editingLink.name,
      url: editingLink.url,
      icon: editingLink.icon || 'fas fa-link',
      color: editingLink.color || '#3B82F6',
      order: editingLink.order || (links.length + 1)
    };

    try {
      await supabaseService.saveContactLink(linkToSave);
      addLog(`Link ${linkToSave.name} berhasil disimpan`);
      setEditingLink(null);
      // Re-load to sync UI
      const updatedLinks = await supabaseService.getContactLinks();
      setLinks(updatedLinks);
    } catch (err) {
      console.error('Save error:', err);
      addLog('Gagal menyimpan link');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, name } = confirmDelete;
    
    try {
      await supabaseService.deleteContactLink(id);
      addLog(`Link ${name} berhasil dihapus`);
      setConfirmDelete(null);
      // Re-load to sync UI
      const updatedLinks = await supabaseService.getContactLinks();
      setLinks(updatedLinks);
    } catch (err) {
      console.error('Delete error:', err);
      addLog('Gagal menghapus link');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Pusat Bantuan</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Atur link bantuan/CS untuk pelanggan</p>
        </div>
        <button
          onClick={() => setEditingLink({ name: '', url: '', icon: 'fab fa-whatsapp', color: '#25D366', order: links.length + 1 })}
          className="bg-orange-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 active:scale-95 transition-all"
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <AnimatePresence>
        {editingLink && (
          <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-[320px] w-full border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="bg-white px-6 py-5 border-b border-gray-100 flex items-center gap-4 shrink-0">
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shrink-0"
                  style={{ backgroundColor: editingLink.color || '#3B82F6' }}
                >
                  <i className={editingLink.icon || 'fas fa-link'}></i>
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-[9px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1">Editor Bantuan</h3>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight truncate">
                    {editingLink.name || 'Link Baru'}
                  </h4>
                </div>
              </div>
              
              <div className="p-6 pt-5 bg-white flex-1">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Link</label>
                    <input
                      type="text"
                      value={editingLink.name}
                      onChange={e => setEditingLink({...editingLink, name: e.target.value})}
                      placeholder="WhatsApp CS"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL / Link Tujuan</label>
                    <input
                      type="url"
                      value={editingLink.url}
                      onChange={e => setEditingLink({...editingLink, url: e.target.value})}
                      placeholder="https://wa.me/..."
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ikon</label>
                      <input
                        type="text"
                        value={editingLink.icon}
                        onChange={e => setEditingLink({...editingLink, icon: e.target.value})}
                        placeholder="fab fa-whatsapp"
                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Warna</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={editingLink.color || '#3B82F6'}
                          onChange={e => setEditingLink({...editingLink, color: e.target.value})}
                          className="h-10 w-10 p-1 bg-white border border-gray-100 rounded-lg cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={editingLink.color}
                          onChange={e => setEditingLink({...editingLink, color: e.target.value})}
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-1 text-[9px] font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    {editingLink.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete({ id: editingLink.id!, name: editingLink.name! });
                          setEditingLink(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingLink(null)}
                      className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-400 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-[2.5] py-3 rounded-xl bg-orange-600 text-white font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-100"
                    >
                      Simpan Link
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 gap-4 px-1">
        {loading ? (
          <div className="col-span-4 py-10 text-center animate-pulse">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Memuat Link...</p>
          </div>
        ) : links.length > 0 ? (
          links.map(link => (
            <div 
              key={link.id}
              className="flex flex-col items-center gap-2 group"
            >
              <button
                onClick={() => setEditingLink(link)}
                className="w-full aspect-square rounded-[2rem] flex flex-col items-center justify-center text-white text-2xl shadow-lg hover:scale-105 active:scale-95 transition-all relative overflow-hidden group/btn"
                style={{ backgroundColor: link.color }}
              >
                <i className={`${link.icon} relative z-10`}></i>
                <div className="absolute inset-0 bg-black/0 group-hover/btn:bg-black/5 transition-colors"></div>
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                  <i className="fas fa-pen text-[8px]"></i>
                </div>
              </button>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight text-center truncate w-full group-hover:text-gray-800 transition-colors">
                {link.name}
              </span>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <i className="fas fa-link text-3xl text-gray-200 mb-4"></i>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Belum ada link bantuan</p>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[12000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] max-w-[280px] w-full p-8 shadow-2xl"
            >
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-xl mb-6 mx-auto shadow-sm border border-red-50">
                <i className="fas fa-trash-alt"></i>
              </div>
              <h2 className="text-lg font-black text-center text-gray-800 mb-2 tracking-tight uppercase">Hapus Link?</h2>
              <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Link <span className="text-gray-600 font-black">"{confirmDelete.name}"</span> akan dihapus permanen.
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleDelete} 
                  className="w-full py-3.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
                >
                  Hapus Sekarang
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)} 
                  className="w-full py-3 rounded-xl text-gray-400 font-black text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                >
                  Batalkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSupport;
