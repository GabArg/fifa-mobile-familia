import React from 'react';
import { StorageService } from '../services/StorageService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const DataView = ({ onBack, isAdmin, handleGoogleLogin, handleLogout, user }) => {
    const APP_VERSION = "v2.5 (Timeout Test)";

    const handleReset = async () => {
        if (!isAdmin) {
            alert("❌ ERROR: No estás detectado como Administrador.\n\nInicia sesión en el botón verde para poder borrar la nube.");
            return;
        }

        if (confirm('⚠️ PELIGRO NUCLEAR ⚠️\n\n¿Estás 100% SEGURO de borrar TODA la base de datos de la Nube y el Local?\n\nEsto eliminará permanentemente todos los partidos y torneos.')) {
            if (confirm('¿Última oportunidad? Escribe "SI" (mentalmente) y dale Aceptar.')) {
                try {
                    const { CloudService } = await import('../services/CloudService');

                    document.body.style.cursor = 'wait';

                    const deletePromise = CloudService.deleteAllData();
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Tiempo de espera agotado. Verifica tu conexión o permisos.")), 5000)
                    );

                    await Promise.race([deletePromise, timeoutPromise]);

                    alert('✅ BASE DE DATOS BORRADA EN LA NUBE.\n\nLa aplicación se recargará ahora como nueva.');

                    StorageService.resetStats();
                    window.location.reload();
                } catch (e) {
                    alert('❌ Error borrando nube: ' + e.message);
                    document.body.style.cursor = 'default';
                }
            }
        }
    };

    const handleExport = () => {
        const json = StorageService.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fifa_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = StorageService.importData(e.target.result);
            if (success) {
                alert('¡Backup restaurado con éxito!');
                window.location.reload();
            } else {
                alert('Error al restaurar. El archivo parece inválido.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="stats-view animate-fade-in w-full h-full flex flex-col">
            <div className="view-header-row mb-6">
                {/* Empty header or back button if needed, but App.jsx handles Nav. 
                     We can put a title here. */}
                <h2 className="view-title">CONFIGURACIÓN</h2>
            </div>

            <Card className="flex-1 w-full overflow-hidden flex flex-col p-4">
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-end mb-6 flex-shrink-0 min-h-[60px]">
                        <div>
                            <h2 className="view-title leading-none">Gestión de Datos</h2>
                            <p className="text-white/50 text-xs mt-1">
                                Backups y Nube <span className="text-[10px] bg-white/10 px-1 rounded text-white/30 font-mono ml-2">{APP_VERSION}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-6">
                        {/* CLOUD & ADMIN SECTION */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                            <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="text-2xl">☁️</span> Nube & Admin
                            </h3>

                            {isAdmin ? (
                                <div className="flex flex-col gap-4">
                                    <div className="bg-green-500/20 text-green-400 p-2 rounded text-center font-bold text-sm border border-green-500/50">
                                        ✅ MODO ADMIN ACTIVO
                                    </div>
                                    <p className="text-white/50 text-xs text-center mb-2">Sesión: {user?.email}</p>
                                    <Button onClick={handleLogout} className="w-full bg-red-900/50 hover:bg-red-900 text-xs py-1 mb-4 border border-red-500/30">
                                        Cerrar Sesión
                                    </Button>

                                    <div>
                                        <h4 className="text-white font-bold mb-1">Diagnóstico</h4>
                                        <Button onClick={async () => {
                                            try {
                                                const { CloudService } = await import('../services/CloudService');
                                                alert("🔍 Iniciando diagnóstico...\n\nSi esto se queda cargando, hay problemas de conexión/permisos.");
                                                const report = await CloudService.runDiagnostics();
                                                alert(`📊 REPORTE DE ESTADO:\n\n🌍 NUBE:\n- Partidos: ${report.cloudMatches}\n- Torneos: ${report.cloudTournaments}\n\n📱 LOCAL:\n- Partidos: ${StorageService.getMatches().length}\n- Torneos: ${StorageService.getTournaments().length}\n\n${report.cloudMatches > 0 ? "⚠️ HAY DATOS EN LA NUBE QUE NO SE BORRARON" : "✅ Nube limpia"}`);
                                            } catch (e) {
                                                alert("❌ Error Diagnóstico: " + e.message);
                                            }
                                        }} className="w-full bg-yellow-600 hover:bg-yellow-500 mb-2">
                                            🔍 Test Conexión Nube
                                        </Button>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-bold mb-1">Sincronización Inicial</h4>
                                        <Button onClick={async () => {
                                            if (confirm("¿Subir todos los datos locales a la nube?")) {
                                                const { CloudService } = await import('../services/CloudService');
                                                await CloudService.uploadLocalData();
                                                alert("¡Datos subidos!");
                                            }
                                        }} className="w-full btn-primary bg-blue-600 hover:bg-blue-500">
                                            🚀 Subir Datos Locales
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <p className="text-white/50 text-xs">Inicia sesión para gestionar la nube.</p>

                                    <Button onClick={handleGoogleLogin} className="w-full bg-white text-black hover:bg-gray-200">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-xl">🇬</span>
                                            <span>Iniciar con Google</span>
                                        </div>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Backup Section */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                            <h3 className="text-[--primary] font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="text-2xl">💾</span> Copia de Seguridad
                            </h3>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <h4 className="text-white font-bold mb-1">Exportar Datos</h4>
                                    <p className="text-white/50 text-xs mb-3">Descarga un archivo con todo tu historial.</p>
                                    <Button onClick={handleExport} className="w-full">
                                        📥 Descargar Backup
                                    </Button>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <h4 className="text-white font-bold mb-1">Importar Datos</h4>
                                    <p className="text-white/50 text-xs mb-3">Restaura un archivo de backup previamente descargado.</p>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="block w-full text-sm text-gray-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-[--primary] file:text-black
                                    hover:file:bg-[#bbe400]
                                    cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mt-auto mb-6">
                            <h3 className="text-red-500 font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="text-2xl">⚠️</span> Zona de Peligro
                            </h3>

                            <div>
                                <h4 className="text-white font-bold mb-1">Resetear de Fábrica</h4>
                                <p className="text-white/50 text-xs mb-3">
                                    Borra TODO (partidos, estadísticas, torneos) y deja la app como nueva.
                                    <br /><strong>No se puede deshacer.</strong>
                                </p>
                                <Button onClick={handleReset} variant="danger" className="w-full">
                                    🧨 Borrar Todo
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
