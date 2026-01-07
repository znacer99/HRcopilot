import { useState } from 'react';
import { Home, Users, FileText, User, LogOut, Calendar, Mail, Phone, Building2 } from 'lucide-react';

type Tab = 'home' | 'colleagues' | 'documents' | 'profile';

type EmployeeAppProps = {
    user: { id: number; name: string; email: string; role: string; department?: string };
    onLogout: () => void;
};

export function EmployeeApp({ user, onLogout }: EmployeeAppProps) {
    const [activeTab, setActiveTab] = useState<Tab>('home');

    // Mock colleagues in same department
    const colleagues = [
        { id: 1, name: 'Sarah Johnson', position: 'Senior Developer', avatar: '👩‍💼', email: 'sarah.j@company.com' },
        { id: 2, name: 'Michael Chen', position: 'Tech Lead', avatar: '👨‍💼', email: 'michael.c@company.com' },
        { id: 3, name: 'Emily Rodriguez', position: 'Developer', avatar: '👩‍💻', email: 'emily.r@company.com' },
        { id: 4, name: 'James Wilson', position: 'DevOps Engineer', avatar: '👨‍💻', email: 'james.w@company.com' },
    ];

    const myDocuments = [
        { id: 1, name: 'Employment Contract', date: '2024-01-15', size: '2.4 MB' },
        { id: 2, name: 'ID Card Copy', date: '2024-01-15', size: '1.2 MB' },
        { id: 3, name: 'Tax Documents 2024', date: '2024-03-10', size: '856 KB' },
        { id: 4, name: 'Performance Review Q2', date: '2024-07-01', size: '680 KB' },
    ];

    const myLeaves = [
        { id: 1, type: 'Annual Leave', dates: 'Dec 24-31, 2024', status: 'pending', days: 8 },
        { id: 2, type: 'Sick Leave', dates: 'Nov 5, 2024', status: 'approved', days: 1 },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div className="p-4 space-y-6">
                        {/* Welcome Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                            <h2 className="text-white mb-1">Welcome, {user.name}</h2>
                            <p className="text-blue-100 text-sm">{user.department} Department</p>
                            <p className="text-blue-100 text-sm">Employee Portal</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="text-gray-900 mb-1">8</div>
                                <div className="text-gray-500 text-sm">Days Off This Year</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="text-gray-900 mb-1">4</div>
                                <div className="text-gray-500 text-sm">Team Members</div>
                            </div>
                        </div>

                        {/* My Leave Requests */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-gray-900 mb-4">My Leave Requests</h3>
                            <div className="space-y-3">
                                {myLeaves.map((leave) => (
                                    <div key={leave.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-700 text-sm">{leave.type}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs">{leave.dates}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Documents */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-gray-900 mb-4">Recent Documents</h3>
                            <div className="space-y-2">
                                {myDocuments.slice(0, 3).map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <div className="flex-1">
                                            <p className="text-gray-700 text-sm">{doc.name}</p>
                                            <p className="text-gray-400 text-xs">{doc.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'colleagues':
                return (
                    <div className="p-4 space-y-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-gray-900 mb-1">{user.department} Team</h3>
                            <p className="text-gray-500 text-sm">{colleagues.length} team members</p>
                        </div>

                        <div className="space-y-3">
                            {colleagues.map((colleague) => (
                                <div key={colleague.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl flex-shrink-0">
                                            {colleague.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-gray-900">{colleague.name}</h4>
                                            <p className="text-gray-600 text-sm">{colleague.position}</p>
                                            <p className="text-gray-400 text-xs mt-1">{colleague.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'documents':
                return (
                    <div className="p-4 space-y-4">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm">My Documents</span>
                                <span className="text-sm">{myDocuments.length} files</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {myDocuments.map((doc) => (
                                <div key={doc.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-gray-900 text-sm">{doc.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-gray-400 text-xs">{doc.date}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-400 text-xs">{doc.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="p-4 space-y-6">
                        {/* Profile Header */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl mx-auto mb-4">
                                👤
                            </div>
                            <h2 className="text-gray-900 mb-1">{user.name}</h2>
                            <p className="text-gray-600">Employee</p>
                            <p className="text-gray-500 text-sm mt-1">{user.department}</p>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-gray-900 mb-4">Contact Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-gray-700 text-sm">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-gray-700 text-sm">+1 234 567 8900</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="text-gray-700 text-sm">{user.department}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={onLogout}
                            className="w-full bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-4">
                    <h1 className="text-gray-900">Employee Portal</h1>
                    <p className="text-gray-500 text-sm">{user.name}</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-h-[calc(100vh-140px)]">
                {renderContent()}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
                <div className="grid grid-cols-4 h-16">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-xs">Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('colleagues')}
                        className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'colleagues' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">Team</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'documents' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="text-xs">Docs</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-xs">Profile</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
