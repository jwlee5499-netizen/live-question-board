import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Globe, Wifi, Edit3, RotateCcw } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
  serverIp?: string;
  publicUrl?: string | null;
  onUpdatePublicUrl?: (url: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomTitle,
  serverIp,
  publicUrl,
  onUpdatePublicUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  // 접속 가능한 모바일 URL 구성
  let baseDomain = '';
  let isUsingPublic = false;

  if (publicUrl) {
    baseDomain = publicUrl.replace(/\/$/, '');
    isUsingPublic = true;
  } else {
    const port = window.location.port ? `:${window.location.port}` : '';
    const host = serverIp && window.location.hostname === 'localhost'
      ? serverIp
      : window.location.hostname;
    baseDomain = `${window.location.protocol}//${host}${port}`;
  }

  const joinUrl = `${baseDomain}?room=${roomId}&mode=audience`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePublicUrl) {
      onUpdatePublicUrl(customInput);
    }
    setIsEditingUrl(false);
  };

  const handleResetUrl = () => {
    if (onUpdatePublicUrl) {
      onUpdatePublicUrl('');
    }
    setIsEditingUrl(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Network Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full mb-2 bg-indigo-50 text-indigo-700">
          {isUsingPublic ? (
            <>
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>와이파이 없이 LTE/5G 데이터로 즉시 접속 가능</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-indigo-500" />
              <span>로컬 Wi-Fi 네트워크 접속 모드</span>
            </>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">{roomTitle}</h3>
        <p className="text-sm text-slate-500 mb-5">
          질문 보드 참여 코드: <span className="font-mono font-bold text-indigo-600 text-lg tracking-wider">#{roomId}</span>
        </p>

        {/* QR Code Container */}
        <div className="flex justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner mb-5">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <QRCodeSVG
              value={joinUrl}
              size={210}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        {/* URL Link and Copy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="bg-transparent text-xs text-slate-600 flex-1 outline-none px-2 font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  복사
                </>
              )}
            </button>
          </div>

          {/* Edit Custom URL Section */}
          {!isEditingUrl ? (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>{isUsingPublic ? '🌐 공개 인터넷 주소 적용됨' : '📶 로컬 IP 주소 적용됨'}</span>
              <button
                onClick={() => {
                  setCustomInput(publicUrl || '');
                  setIsEditingUrl(true);
                }}
                className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3 h-3" />
                접속 주소 직접 설정
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveCustom} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                외부 접속 URL (ngrok / Cloudflare / 핫스팟 IP 등)
              </label>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="예: https://my-board.loca.lt"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-mono"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetUrl}
                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1 hover:bg-slate-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  기본값 복원
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="px-2.5 py-1 text-slate-500 rounded-lg text-[11px]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700"
                >
                  저장
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-4 p-2.5 bg-amber-50/80 border border-amber-100 rounded-xl text-left text-[11px] text-amber-800 leading-relaxed">
          💡 <strong>와이파이가 없는 강연장 팁:</strong> 발표자 PC에서 <code>npm run share</code>를 실행하면 와이파이 없이도 청중들이 LTE/5G 데이터로 바로 접속할 수 있는 무료 공개 주소가 자동 연결됩니다.
        </div>
      </div>
    </div>
  );
};
