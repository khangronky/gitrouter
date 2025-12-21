'use client';

import { useState, useRef } from 'react';
import { IconBuilding, IconUser, IconUsers, IconPlus, IconMinus, IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Member {
  id: number;
  isNew: boolean;
  isRemoving: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  teamId: string;
}

export function TeamCell() {
  const [teams, setTeams] = useState([
    { id: 'frontend', name: 'Frontend', members: [{ id: 1, isNew: false, isRemoving: false }, { id: 2, isNew: false, isRemoving: false }, { id: 3, isNew: false, isRemoving: false }] as Member[] },
    { id: 'backend', name: 'Backend', members: [{ id: 4, isNew: false, isRemoving: false }, { id: 5, isNew: false, isRemoving: false }, { id: 6, isNew: false, isRemoving: false }] as Member[] },
  ]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextMemberIdRef = useRef(7);
  const nextParticleIdRef = useRef(0);

  const addMember = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMemberId = nextMemberIdRef.current++;
    
    // Add to the beginning with isNew flag for animation
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? { ...team, members: [{ id: newMemberId, isNew: true, isRemoving: false }, ...team.members] }
          : team
      )
    );

    // Remove isNew flag after animation completes
    setTimeout(() => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? {
                ...team,
                members: team.members.map((m) =>
                  m.id === newMemberId ? { ...m, isNew: false } : m
                ),
              }
            : team
        )
      );
    }, 300);
  };

  const createParticles = (teamId: string, rect: DOMRect, containerRect: DOMRect) => {
    const centerX = rect.left - containerRect.left + rect.width / 2;
    const centerY = rect.top - containerRect.top + rect.height / 2;
    
    // Create 8 particles in different directions
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: nextParticleIdRef.current++,
        x: centerX,
        y: centerY,
        angle: (i * 45) + (Math.random() * 20 - 10), // Spread evenly with some randomness
        teamId,
      });
    }
    
    setParticles((prev) => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 500);
  };

  const removeMember = (teamId: string, memberId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get position for particles
    const target = e.currentTarget as HTMLElement;
    const container = target.closest('[data-team-container]') as HTMLElement;
    if (container) {
      createParticles(teamId, target.getBoundingClientRect(), container.getBoundingClientRect());
    }
    
    // Set isRemoving flag to trigger pop animation
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              members: team.members.map((m) =>
                m.id === memberId ? { ...m, isRemoving: true } : m
              ),
            }
          : team
      )
    );

    // Actually remove after animation completes
    setTimeout(() => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, members: team.members.filter((m) => m.id !== memberId) }
            : team
        )
      );
    }, 200);
  };

  return (
    <div className="flex h-full flex-col justify-center">
      {/* Org Tree */}
      <div className="flex flex-col items-center gap-3">
        {/* Organization */}
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-all duration-200 hover:border-white/20 hover:bg-white/10 cursor-pointer">
          <IconBuilding className="h-4 w-4 text-landing-accent-light" />
          <span className="text-sm font-medium text-white">Acme Corp</span>
        </div>

        {/* Connector */}
        <div className="h-3 w-px bg-white/20" />

        {/* Teams */}
        <div className="flex gap-6">
          {teams.map((team) => {
            const isSelected = selectedTeam === team.id;
            const teamParticles = particles.filter((p) => p.teamId === team.id);
            
            return (
              <div
                key={team.id}
                className="flex flex-col items-center gap-2"
                onClick={() => setSelectedTeam(isSelected ? null : team.id)}
              >
                <div
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 transition-all duration-200',
                    isSelected
                      ? 'border-landing-accent/50 bg-landing-accent/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  )}
                >
                  <IconUsers
                    className={cn(
                      'h-3 w-3 transition-colors duration-200',
                      isSelected ? 'text-landing-accent-light' : 'text-white/60'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs transition-colors duration-200',
                      isSelected ? 'text-white' : 'text-white/70'
                    )}
                  >
                    {team.name}
                  </span>
                  {isSelected && (
                    <IconCheck className="ml-1 h-3 w-3 text-green-400" />
                  )}
                </div>

                {/* Members Container */}
                <div className="relative flex -space-x-1" data-team-container>
                  {/* Explosion Particles */}
                  {teamParticles.map((particle) => (
                    <div
                      key={particle.id}
                      className="pointer-events-none absolute h-2 w-2 rounded-full bg-red-500"
                      style={{
                        left: particle.x - 4,
                        top: particle.y - 4,
                        animation: `explode-${Math.round(particle.angle / 45) % 8} 0.5s ease-out forwards`,
                      }}
                    />
                  ))}
                  
                  {team.members.map((member) => {
                    const memberKey = `${team.id}-${member.id}`;
                    const isHovered = hoveredMember === memberKey;

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-landing-bg',
                          'bg-landing-card-hover',
                          isHovered && !member.isRemoving && 'z-10 scale-110 bg-red-500/20 ring-2 ring-red-500/50',
                          isSelected && !isHovered && !member.isNew && !member.isRemoving && 'ring-1 ring-landing-accent/30',
                          member.isNew && 'z-20',
                          member.isRemoving && 'z-20',
                          !member.isNew && !member.isRemoving && 'transition-all duration-200 hover:scale-105'
                        )}
                        onMouseEnter={() => !member.isRemoving && setHoveredMember(memberKey)}
                        onMouseLeave={() => setHoveredMember(null)}
                        onClick={(e) => !member.isRemoving && removeMember(team.id, member.id, e)}
                        style={{
                          ...(member.isNew && {
                            animation: 'slideInLeft 0.3s ease-out forwards',
                          }),
                          ...(member.isRemoving && {
                            animation: 'popOut 0.2s ease-out forwards',
                          }),
                        }}
                      >
                        {isHovered && !member.isRemoving ? (
                          <IconMinus className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <IconUser className="h-3.5 w-3.5 text-white/40" />
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Add member button */}
                  <div
                    onClick={(e) => addMember(team.id, e)}
                    className={cn(
                      'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-all duration-200 hover:scale-110',
                      'border-white/20 hover:border-green-500/50 hover:bg-green-500/10',
                      isSelected && 'border-landing-accent/50 hover:border-green-500/50'
                    )}
                  >
                    <IconPlus className="h-3 w-3 text-white/30 transition-colors hover:text-green-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] text-white/30">
        Click + to add • Hover & click to remove
      </p>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes popOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }
        @keyframes explode-0 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(25px, 0) scale(0); opacity: 0; }
        }
        @keyframes explode-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(18px, -18px) scale(0); opacity: 0; }
        }
        @keyframes explode-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, -25px) scale(0); opacity: 0; }
        }
        @keyframes explode-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-18px, -18px) scale(0); opacity: 0; }
        }
        @keyframes explode-4 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-25px, 0) scale(0); opacity: 0; }
        }
        @keyframes explode-5 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-18px, 18px) scale(0); opacity: 0; }
        }
        @keyframes explode-6 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, 25px) scale(0); opacity: 0; }
        }
        @keyframes explode-7 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(18px, 18px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
