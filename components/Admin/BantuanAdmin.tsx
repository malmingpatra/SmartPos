
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
          className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <AnimatePresence>
        {editingLink && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl mx-1"
          >
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Editor Link</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Link</label>
                  <input
                    type="text"
                    value={editingLink.name}
                    onChange={e => setEditingLink({...editingLink, name: e.target.value})}
                    placeholder="Contoh: WhatsApp CS"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ikon (FontAwesome)</label>
                  <input
                    type="text"
                    value={editingLink.icon}
                    onChange={e => setEditingLink({...editingLink, icon: e.target.value})}
                    placeholder="fab fa-whatsapp"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL / Link Tujuan</label>
                <input
                  type="url"
                  value={editingLink.url}
                  onChange={e => setEditingLink({...editingLink, url: e.target.value})}
                  placeholder="https://wa.me/..."
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Warna Ikon (HEX)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingLink.color || '#3B82F6'}
                      onChange={e => setEditingLink({...editingLink, color: e.target.value})}
                      className="h-10 w-10 p-1 bg-white border border-gray-100 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingLink.color}
                      onChange={e => setEditingLink({...editingLink, color: e.target.value})}
                      className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Urutan</label>
                  <input
                    type="number"
                    value={editingLink.order}
                    onChange={e => setEditingLink({...editingLink, order: parseInt(e.target.value)})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100"
                >
                  Simpan Link
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3 px-1">
        {loading ? (
          <div className="py-10 text-center animate-pulse">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Memuat Link...</p>
          </div>
        ) : links.length > 0 ? (
          links.map(link => (
            <div 
              key={link.id}
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-md"
                  style={{ backgroundColor: link.color }}
                >
                  <i className={link.icon}></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 tracking-tight">{link.name}</h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[150px]">{link.url}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingLink(link)}
                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"
                >
                  <i className="fas fa-edit text-[10px]"></i>
                </button>
                <button 
                  onClick={() => setConfirmDelete({ id: link.id, name: link.name })}
                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
                >
                  <i className="fas fa-trash text-[10px]"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <i className="fas fa-link text-3xl text-gray-200 mb-4"></i>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Belum ada link bantuan</p>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-6 mx-auto">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="text-xl font-black text-center text-gray-800 mb-2 tracking-tight">Konfirmasi Hapus</h2>
              <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">
                Hapus link <span className="text-gray-800">"{confirmDelete.name}"</span>? Data akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)} 
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-red-100 active:scale-95 transition-all"
                >
                  Ya, Hapus
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
