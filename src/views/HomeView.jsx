import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { NeonBall } from '../components/NeonBall';
import { useAudio } from '../hooks/useAudio';

export const HomeView = ({ onNavigate }) => {
    const { playClick, playHover } = useAudio();

    const handleNavigate = (view) => {
        playClick();
        onNavigate(view);
    };

    return (
        <div className="home-view animate-fade-in">

            <div className="home-header">
                <h2 className="section-title animate-slide-in">Bienvenido al Estadio</h2>
                <p className="section-subtitle animate-slide-in" style={{ animationDelay: '0.1s' }}>Selecciona el modo de competición</p>
            </div>

            <div className="card-grid">
                {/* Duel Mode */}
                <Card
                    className="mode-card card-duel animate-slide-in"
                    style={{ animationDelay: '0.2s' }}
                    onClick={() => handleNavigate('DUEL')}
                    onMouseEnter={playHover}
                >
                    <div className="card-bg-glow"></div>
                    <div className="card-icon-wrapper">
                        <NeonBall className="card-icon-svg" color="#00ff9d" />
                    </div>
                    <h3 className="card-title">Duelo 1v1</h3>
                    <p className="card-desc">Partidos de Ida y Vuelta. El clásico desafío.</p>
                    <Button variant="primary" className="width-full">Jugar Duelo</Button>
                </Card>

                {/* Tournament 3 */}
                <Card
                    className="mode-card card-triangular animate-slide-in"
                    style={{ animationDelay: '0.3s' }}
                    onClick={() => handleNavigate('TORNEO3')}
                    onMouseEnter={playHover}
                >
                    <div className="card-bg-glow"></div>
                    <div className="card-emoji">🔺</div>
                    <h3 className="card-title">Triangular</h3>
                    <p className="card-desc">Liga de 3 jugadores. Todos contra todos.</p>
                    <Button variant="secondary" className="width-full">Iniciar Torneo</Button>
                </Card>

                {/* Tournament 4 */}
                <Card
                    className="mode-card card-cup animate-slide-in"
                    style={{ animationDelay: '0.4s' }}
                    onClick={() => handleNavigate('TORNEO4')}
                    onMouseEnter={playHover}
                >
                    <div className="card-bg-glow"></div>
                    <div className="card-emoji">🏆</div>
                    <h3 className="card-title">Copa de 4</h3>
                    <p className="card-desc">Eliminatoria directa. Semis y Final.</p>
                    <Button variant="danger" className="width-full">Crear Copa</Button>
                </Card>

                {/* Stats */}
                <Card
                    className="mode-card card-stats animate-slide-in"
                    style={{ animationDelay: '0.5s' }}
                    onClick={() => handleNavigate('STATS')}
                    onMouseEnter={playHover}
                >
                    <div className="card-emoji">📊</div>
                    <h3 className="card-title">Estadísticas</h3>
                    <p className="card-desc">¿Quién es el rey de la cancha?</p>
                    <Button variant="secondary" className="width-full">Ver Tabla</Button>
                </Card>
            </div>
        </div>
    );
};

