; Masaustu kisayolu her zaman olustur (oneClick sessiz kurulumda kaybolmasini onler)
!macro customInstall
  ; Eski kisayol varsa sil, yeniden olustur (ikon guncellenmesi icin)
  Delete "$DESKTOP\Satin Alma Rapor.lnk"
  ; Use the installed uninstallerIcon.ico (electron-builder output) for the shortcut icon
  CreateShortCut "$DESKTOP\Satin Alma Rapor.lnk" "$INSTDIR\Satin Alma Rapor.exe" "" "$INSTDIR\\uninstallerIcon.ico" 0
!macroend
