import React, { useState } from 'react';
import { Button, Card, Input } from '../components/UI/index';

export const CreateCircle: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: ['']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, '']
    });
  };

  const handleRemoveMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index)
    });
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      console.log('Criar círculo:', formData);
      alert('✓ Círculo criado com sucesso!');
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 p-lg sticky top-0 z-fixed">
        <div className="flex items-center gap-md mb-lg">
          <button
            onClick={onBack}
            className="text-2xl hover:opacity-75 transition-opacity"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">Novo Círculo</h1>
        </div>

        {/* PROGRESS */}
        <div className="flex gap-md">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-gradient-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* FORM */}
      <main className="p-lg pb-24 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-xl">
          {step === 1 ? (
            <>
              {/* STEP 1: BÁSICO */}
              <div className="space-y-lg">
                <h2 className="text-xl font-bold">Informações Básicas</h2>

                <Input
                  label="Nome do Círculo"
                  name="name"
                  placeholder="Ex: Minha Família, Amigos, Apartamento"
                  value={formData.name}
                  onChange={handleInputChange}
                  icon="📝"
                  required
                />

                <div className="flex flex-col gap-sm">
                  <label className="font-semibold text-sm">Descrição (opcional)</label>
                  <textarea
                    name="description"
                    placeholder="Descreva o propósito deste círculo..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="textarea"
                  />
                </div>

                {/* AVATAR PICKER */}
                <div className="flex flex-col gap-sm">
                  <label className="font-semibold text-sm">Escolha um ícone</label>
                  <div className="grid grid-cols-5 gap-md">
                    {['👨‍👩‍👧‍👦', '👥', '🏠', '🎓', '🎉', '⚽', '🍽️', '🏃'].map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="text-4xl p-lg bg-white rounded-lg hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-600 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* STEP 2: MEMBROS */}
              <div className="space-y-lg">
                <h2 className="text-xl font-bold">Convidar Membros</h2>
                <p className="text-gray-600">
                  Adicione os e-mails das pessoas que deseja convidar. Elas receberão um link para entrar no círculo.
                </p>

                <div className="space-y-md">
                  {formData.members.map((member, index) => (
                    <div key={index} className="flex gap-sm">
                      <Input
                        type="email"
                        placeholder="nome@email.com"
                        value={member}
                        onChange={(e) => handleMemberChange(index, e.target.value)}
                        icon="📧"
                        className="flex-1"
                      />
                      {formData.members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="btn btn-secondary btn-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleAddMember}
                  className="w-full"
                >
                  + Adicionar Outro Membro
                </Button>

                {/* INFO BOX */}
                <Card className="bg-blue-50 border-blue-200">
                  <div className="flex gap-md">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Não tem email?</p>
                      <small className="text-blue-800">
                        Você pode convidar membros depois usando um link compartilhável.
                      </small>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* BUTTONS */}
          <div className="flex gap-md pt-lg sticky bottom-0 bg-gradient-to-t from-white to-transparent p-lg -mx-lg">
            {step === 2 && (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              {step === 1 ? 'Próximo' : 'Criar Círculo'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
