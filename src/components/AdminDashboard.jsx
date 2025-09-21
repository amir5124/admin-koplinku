import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FaFileExcel } from 'react-icons/fa';

const AdminDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterSimpanan, setFilterSimpanan] = useState('ALL');
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [jenisSimpanan, setJenisSimpanan] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // State untuk total nominal dari backend
    const [totalSukses, setTotalSukses] = useState(0);

    const API_BASE_URL = 'https://kop.siappgo.id';

    const fetchPaymentHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/history-pembayaran-all`, {
                params: {
                    search: searchTerm,
                    status: filterStatus,
                    jenis_simpanan_id: filterSimpanan
                }
            });
            setPaymentHistory(res.data.history);
            // Ambil total nominal dari respons backend dan perbarui state
            setTotalSukses(res.data.total_nominal || 0);
        } catch (err) {
            setError('Gagal memuat data riwayat pembayaran. Mohon coba lagi.');
            setPaymentHistory([]);
            setTotalSukses(0);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJenisSimpanan = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/jenis-simpanan`);
            setJenisSimpanan(res.data.jenis_simpanan);
        } catch (err) {
            console.error("Failed to fetch jenis simpanan:", err);
        }
    };

    useEffect(() => {
        fetchJenisSimpanan();
    }, []);

    useEffect(() => {
        fetchPaymentHistory();
    }, [searchTerm, filterStatus, filterSimpanan]);

    // Hapus useEffect ini karena total sudah dihitung di backend
    // useEffect(() => {
    //     if (paymentHistory && Array.isArray(paymentHistory)) {
    //         const total = paymentHistory
    //             .filter(item => item.status_pembayaran === 'SUKSES')
    //             .reduce((sum, item) => sum + item.jumlah, 0);
    //         setTotalSukses(total);
    //     }
    // }, [paymentHistory]);

    const exportToExcel = () => {
        const dataToExport = paymentHistory.filter(item => item.status_pembayaran === 'SUKSES').map(item => ({
            'Anggota': item.nama_anggota,
            'Tanggal': new Date(item.created_at).toLocaleDateString(),
            'Jumlah': item.jumlah,
            'Jenis Simpanan': item.jenis_simpanan,
            'Metode Pembayaran': item.jenis_pembayaran,
            'Keterangan': item.keterangan,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transaksi Sukses");
        XLSX.writeFile(wb, "transaksi_sukses_koperasi.xlsx");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <div className="container mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 transform transition-transform duration-300">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Opsi Filter & Pencarian</h2>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:w-1/3">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Cari berdasarkan nama anggota..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                            </div>
                        </div>
                        <select
                            className="w-full md:w-1/3 pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="SUKSES">SUKSES</option>
                            <option value="PENDING">PENDING</option>
                            <option value="FAILED">FAILED</option>
                        </select>
                        <select
                            className="w-full md:w-1/3 pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterSimpanan}
                            onChange={(e) => setFilterSimpanan(e.target.value)}
                        >
                            <option value="ALL">Semua Jenis Simpanan</option>
                            {jenisSimpanan.map(simpanan => (
                                <option key={simpanan.id} value={simpanan.id}>{simpanan.nama_simpanan}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {filterStatus === 'SUKSES' && (
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <span className="text-xl font-bold text-green-600 mb-2 md:mb-0">
                            Total Transaksi Sukses: {formatCurrency(totalSukses)}
                        </span>
                        <button
                            onClick={exportToExcel}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg shadow-md hover:bg-gray-300 transition-colors flex items-center space-x-2"
                        >
                            <FaFileExcel className="text-xl text-green-600" />
                            <span>Export ke Excel</span>
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Riwayat Pembayaran</h2>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                            <p>{error}</p>
                        </div>
                    ) : paymentHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anggota</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Simpanan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paymentHistory.map((item) => (
                                        <tr key={item.id_pembayaran} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_anggota}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.jumlah)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jenis_simpanan || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jenis_pembayaran} ({item.bank_name || 'QRIS'})</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.keterangan || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status_pembayaran === 'SUKSES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {item.status_pembayaran}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Tidak ada riwayat pembayaran yang ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;