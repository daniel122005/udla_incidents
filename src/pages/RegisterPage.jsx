// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerWithEmail } from '../services/auth';
import toast from 'react-hot-toast';
import { AlertTriangle, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const pwd = watch('password');

  async function onSubmit(data) {
    setLoading(true);
    try {
      await registerWithEmail(data.email, data.password, data.nombre);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este correo ya está registrado'
        : err.code === 'auth/weak-password'
        ? 'La contraseña debe tener al menos 6 caracteres'
        : 'Error al crear la cuenta';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
            <img src="/logo.jpg" alt="Logo UDLA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Sistema de Reporte de Incidentes — UDLA</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">
              <User size={14} style={{ display: 'inline', marginRight: 4 }} />
              Nombre completo <span className="required">*</span>
            </label>
            <input
              id="register-nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              className={`form-input ${errors.nombre ? 'error' : ''}`}
              {...register('nombre', {
                required: 'El nombre es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
            />
            {errors.nombre && <span className="form-error">{errors.nombre.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
              Correo electrónico <span className="required">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              placeholder="tucorreo@udla.edu.co"
              className={`form-input ${errors.email ? 'error' : ''}`}
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginRight: 4 }} />
              Contraseña <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className={`form-input ${errors.password ? 'error' : ''}`}
                style={{ paddingRight: '2.5rem' }}
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginRight: 4 }} />
              Confirmar contraseña <span className="required">*</span>
            </label>
            <input
              id="register-confirm"
              type={showPwd ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              className={`form-input ${errors.confirm ? 'error' : ''}`}
              {...register('confirm', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === pwd || 'Las contraseñas no coinciden',
              })}
            />
            {errors.confirm && <span className="form-error">{errors.confirm.message}</span>}
          </div>

          <button id="register-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>
        </form>

        <hr className="divider" />
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
