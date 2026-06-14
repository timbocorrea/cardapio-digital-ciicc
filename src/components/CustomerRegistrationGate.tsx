import React, { useState, useEffect } from 'react';
import {
  getCurrentSession,
  onSupabaseAuthStateChange,
  signInWithGoogle,
  signOutFromSupabase,
  type AuthSession,
} from '../features/auth/supabaseAuthService';
import {
  getCustomerProfileByAuthUserId,
  upsertCustomerProfile,
} from '../features/supabase/supabaseCoreDataService';
import type { CustomerRegistration } from '../types';
import { User, Briefcase, Clock, Sparkles, LogIn, RefreshCw, Check, AlertCircle, HelpCircle, Upload, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerRegistrationGateProps {
  onAccessGranted: (info: CustomerRegistration) => void;
  onAdminAccess?: () => void;
}

export default function CustomerRegistrationGate({ onAccessGranted, onAdminAccess }: CustomerRegistrationGateProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [shiftHours, setShiftHours] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);




  useEffect(() => {
    const handleSession = async (currentSession: AuthSession | null) => {
      setSession(currentSession);

      if (!currentSession?.user) {
        setLoading(false);
        return;
      }

      setCheckingRegistration(true);
      setName(currentSession.user.user_metadata?.full_name || currentSession.user.email || '');

      try {
        const existingProfile = await getCustomerProfileByAuthUserId(currentSession.user.id);

        if (existingProfile?.status === 'active') {
          onAccessGranted({
            uid: existingProfile.authUserId,
            name: existingProfile.displayName,
            email: existingProfile.email,
            workplace: existingProfile.workplace,
            shiftHours: existingProfile.shiftHours,
            photoUrl: existingProfile.photoUrl,
            createdAt: existingProfile.createdAt || new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Erro ao carregar registro de cliente Supabase:', e);
      } finally {
        setCheckingRegistration(false);
        setLoading(false);
      }
    };

    getCurrentSession()
      .then(handleSession)
      .catch((e) => {
        console.error('Erro ao verificar sessão Supabase do cliente:', e);
        setLoading(false);
      });

    const unsubscribe = onSupabaseAuthStateChange((currentSession) => {
      void handleSession(currentSession);
    });

    return () => {
      unsubscribe();
    };
  }, [onAccessGranted]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setPhotoBase64(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 1000000) {
        setRegistrationError('A imagem selecionada é muito grande. Escolha uma foto com menos de 1MB.');
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoBase64(reader.result);
          setRegistrationError(null);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) return;
    if (!name.trim() || !workplace.trim() || !shiftHours.trim() || !photoBase64) {
      return;
    }

    try {
      setRegistrationError(null);
      setCheckingRegistration(true);

      const registrationData = {
        uid: session.user.id,
        name: name.trim(),
        email: session.user.email || '',
        workplace: workplace.trim(),
        shiftHours: shiftHours.trim(),
        photoUrl: photoBase64,
      };

      await upsertCustomerProfile({
        authUserId: registrationData.uid,
        email: registrationData.email,
        displayName: registrationData.name,
        workplace: registrationData.workplace,
        shiftHours: registrationData.shiftHours,
        photoUrl: registrationData.photoUrl,
      });

      onAccessGranted({
        ...registrationData,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Erro ao salvar cadastro do cliente Supabase:', err);
      setRegistrationError('Não foi possível salvar seu cadastro agora. Confira a conexão e tente novamente.');
    } finally {
      setCheckingRegistration(false);
    }
  };

  if (loading || checkingRegistration) {
    return (
      <div id="gate-loader" className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-4" />
        <h3 className="font-display font-medium text-white text-base">Verificando autorização...</h3>
        <p className="text-zinc-400 text-xs mt-1 max-w-xs leading-relaxed">
          Por favor, aguarde enquanto asseguramos sua conexão segura com o sistema de refeições.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 md:p-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3.5">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="font-display font-black text-xl text-white tracking-tight uppercase">
              Acesso ao Cardápio
            </h2>
            <p className="text-zinc-400 text-xs mt-1 sm:max-w-xs">
              Para visualizar os pratos e pedir, faça login e registre suas informações de turno.
            </p>
          </div>

          {!session?.user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-2"
            >
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850 text-left space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Políticas de Acesso</span>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Este cardápio atende exclusivamente a colaboradores verificados. É obrigatório registrar seu <strong>Nome completo</strong>, seu <strong>Local de trabalho</strong> e <strong>foto de identificação do turno</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-4 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm tracking-wide rounded-2xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-98"
              >
                <LogIn className="w-5 h-5 text-zinc-700" />
                Conectar com Google via Supabase
              </button>

              {onAdminAccess && (
                <button
                  type="button"
                  onClick={onAdminAccess}
                  className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs tracking-wide rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Entrar no painel admin
                </button>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitRegistration} className="space-y-5">
              <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-emerald-300 text-xs font-bold">Login Google confirmado via Supabase</p>
                <p className="text-emerald-200/70 text-[10px] mt-0.5">{session.user.email}</p>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Nome completo
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                  placeholder="Seu nome completo"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Local de trabalho
                </span>
                <input
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                  placeholder="Ex: Recepção, Administrativo, Galpão..."
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Horário do turno
                </span>
                <input
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                  placeholder="Ex: 08:00 às 17:00"
                />
              </label>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Foto de identificação
                </span>

                {photoBase64 ? (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
                    <img src={photoBase64} alt="Foto anexada" className="w-16 h-16 rounded-xl object-cover border border-amber-500/20" />
                    <div className="flex-1 text-left">
                      <p className="text-white text-xs font-bold">Foto anexada</p>
                      <p className="text-zinc-500 text-[10px]">Será usada apenas para identificação interna.</p>
                    </div>
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-3">
                    <label className="w-full py-3 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      Enviar foto
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <p className="text-zinc-500 text-[10px] leading-relaxed flex gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      A foto é usada apenas para identificação interna no momento da retirada ou conferência.
                    </p>
                  </div>
                )}
              </div>

              {registrationError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{registrationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!name.trim() || !workplace.trim() || !shiftHours.trim() || !photoBase64}
                  className="w-full py-4 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black text-sm tracking-wide rounded-2xl cursor-pointer transition-all shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Liberar acesso ao cardápio
                </button>

                <button
                  type="button"
                  onClick={() => signOutFromSupabase()}
                  className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs rounded-2xl cursor-pointer transition-colors"
                >
                  Usar outra conta Google
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
