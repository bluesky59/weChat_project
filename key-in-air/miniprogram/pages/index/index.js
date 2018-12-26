Page({
  data: {
    authorizationList: [
      {
        name: '张钙',
        vin: 'LGG8D3D11JZ455645',
      },
      {
        name: '晓晓',
        vin: 'LGG8D3D11JZ455646',
      },
      {
        name: '陈亚楠',
        vin: 'LGG8D3D11JZ455647',
      },
      {
        name: '李平',
        vin: 'LGG8D3D11JZ455648',
      },
    ],
  },
  onLoad: function() {

  },
  skipToPerformPage(ev) {
    // wx.setStorageSync('ownerName', ev.currentTarget.dataset.name);
    // wx.setStorageSync('vin', ev.currentTarget.dataset.vin);
    wx.navigateTo({
      url: `../main/main?ownerName=${ev.currentTarget.dataset.name}&vin=${ev.currentTarget.dataset.vin}`
    });
  },
})
