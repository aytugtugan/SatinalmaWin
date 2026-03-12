; Masaustu kisayolu her zaman olustur (oneClick sessiz kurulumda kaybolmasini onler)
!macro customInstall
  ; Eski kisayol varsa sil, yeniden olustur (ikon guncellenmesi icin)
  Delete "$DESKTOP\Satin Alma Rapor.lnk"
  CreateShortCut "$DESKTOP\Satin Alma Rapor.lnk" "$INSTDIR\Satin Alma Rapor.exe" "" "$INSTDIR\Satin Alma Rapor.exe" 0
!macroend
