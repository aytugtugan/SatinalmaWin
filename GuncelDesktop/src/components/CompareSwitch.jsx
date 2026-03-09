import React from 'react';
import { SwapOutlined } from '@ant-design/icons';

/**
 * Fabrika karşılaştırma toggle bileşeni
 * Sadece "Tüm Fabrikalar" seçiliyken görünür
 */
const CompareSwitch = ({ isVisible, isCompareMode, onToggle }) => {
  if (!isVisible) return null;

  return (
    <div className="compare-switch-bar">
      <div className="compare-switch-left">
        <SwapOutlined className="compare-icon" />
        <span className="compare-label">Fabrikaları Karşılaştır</span>
        {isCompareMode && (
          <span className="compare-hint">Grafikler fabrikaları karşılaştırmalı gösteriyor</span>
        )}
      </div>
      <label className="compare-toggle">
        <input
          type="checkbox"
          checked={isCompareMode}
          onChange={onToggle}
          className="compare-toggle-input"
        />
        <span className="compare-toggle-slider" />
      </label>
    </div>
  );
};

export default CompareSwitch;
