/* Generated from the reviewed snapshot in audit/statistics-20261017.json.
 * Dates, editions, coverage and comparison sources are explicit. */
(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.WGRankings=data})(typeof globalThis!=='undefined'?globalThis:this,{
 "checkedAt": "2026-10-17",
 "rankings": [
  {
   "group": "bloc",
   "id": "bloc-members",
   "title": "회원국 수",
   "unit": "개국",
   "year": "2023",
   "source": "강의 2권 P08",
   "phrase": "회원국이 많은",
   "low": "회원국이 적은",
   "digits": 0,
   "note": "2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지).",
   "items": [
    {
     "name": "EU",
     "value": 27
    },
    {
     "name": "ASEAN",
     "value": 10
    },
    {
     "name": "MERCOSUR",
     "value": 4
    },
    {
     "name": "USMCA",
     "value": 3
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "2023년 회원 수입니다. 현재(2026년)는 ASEAN 11개국, MERCOSUR 활동 정회원 5개국입니다.",
    "sourceUrls": [
     "https://theaseanmagazine.asean.org/article/forging-a-new-era-timor-leste-admitted-into-asean/",
     "https://www.mercosur.int/acerca-del-mercosur/paises"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2026-10-17",
     "source": "각 블록 공식 회원 현황",
     "note": "베네수엘라 자격 정지. 2023년 통계표의 회원 범위와 구별합니다.",
     "sourceUrls": [
      "https://theaseanmagazine.asean.org/article/forging-a-new-era-timor-leste-admitted-into-asean/",
      "https://www.mercosur.int/"
     ],
     "items": [
      {
       "name": "EU",
       "value": 27
      },
      {
       "name": "ASEAN",
       "value": 11
      },
      {
       "name": "MERCOSUR",
       "value": 5
      },
      {
       "name": "USMCA",
       "value": 3
      }
     ]
    }
   }
  },
  {
   "group": "bloc",
   "id": "bloc-pop",
   "title": "총인구",
   "unit": "억 명",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "총인구가 많은",
   "low": "총인구가 적은",
   "digits": 2,
   "note": "2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지).",
   "items": [
    {
     "name": "ASEAN",
     "value": 6.88861459
    },
    {
     "name": "USMCA",
     "value": 5.06543899
    },
    {
     "name": "EU",
     "value": 4.48897545
    },
    {
     "name": "MERCOSUR",
     "value": 2.66911357
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {},
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "2023년 회원 범위를 고정해 2025년 수치를 합산. 현재 회원국 수와 다릅니다. 2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지).",
     "items": [
      {
       "name": "ASEAN",
       "value": 6.98853607
      },
      {
       "name": "USMCA",
       "value": 5.1538341
      },
      {
       "name": "EU",
       "value": 4.51127411
      },
      {
       "name": "MERCOSUR",
       "value": 2.69061549
      }
     ]
    }
   }
  },
  {
   "group": "bloc",
   "id": "bloc-gdp",
   "title": "역내 총생산(GDP 합계)",
   "unit": "조 달러",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "총생산이 많은",
   "low": "총생산이 적은",
   "digits": 1,
   "note": "2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
   "items": [
    {
     "name": "USMCA",
     "value": 31.80252118406567
    },
    {
     "name": "EU",
     "value": 18.659279022583288
    },
    {
     "name": "ASEAN",
     "value": 3.810203645648238
    },
    {
     "name": "MERCOSUR",
     "value": 2.962942645139023
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {
     "EU": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "USMCA": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "ASEAN": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "MERCOSUR": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     }
    },
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2025"
     ],
     "note": "2023년 회원 범위를 고정해 2025년 수치를 합산. 현재 회원국 수와 다릅니다. 2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산. 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
     "items": [
      {
       "name": "USMCA",
       "value": 34.92224113720144
      },
      {
       "name": "EU",
       "value": 21.243212570163294
      },
      {
       "name": "ASEAN",
       "value": 4.266766340669832
      },
      {
       "name": "MERCOSUR",
       "value": 3.0976439079427465
      }
     ]
    }
   }
  },
  {
   "group": "bloc",
   "id": "bloc-trade",
   "title": "상품 무역액(수출+수입)",
   "unit": "조 달러",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "무역액이 많은",
   "low": "무역액이 적은",
   "digits": 2,
   "note": "역내 교역을 포함한 회원국 합계. 2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
   "items": [
    {
     "name": "EU",
     "value": 14.293048
    },
    {
     "name": "USMCA",
     "value": 7.548706
    },
    {
     "name": "ASEAN",
     "value": 3.533053
    },
    {
     "name": "MERCOSUR",
     "value": 0.782922
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/TX.VAL.MRCH.CD.WT?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/TM.VAL.MRCH.CD.WT?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {
     "EU": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "USMCA": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "ASEAN": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "MERCOSUR": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     }
    },
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/TX.VAL.MRCH.CD.WT?format=json&date=2025",
      "https://api.worldbank.org/v2/country/all/indicator/TM.VAL.MRCH.CD.WT?format=json&date=2025"
     ],
     "note": "2023년 회원 범위를 고정해 2025년 수치를 합산. 현재 회원국 수와 다릅니다. 역내 교역을 포함한 회원국 합계. 2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산. 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
     "items": [
      {
       "name": "EU",
       "value": 15.070818
      },
      {
       "name": "USMCA",
       "value": 8.171746
      },
      {
       "name": "ASEAN",
       "value": 4.284198
      },
      {
       "name": "MERCOSUR",
       "value": 0.859269
      }
     ]
    }
   }
  },
  {
   "group": "bloc",
   "id": "bloc-gdppc",
   "title": "1인당 GDP",
   "unit": "천 달러",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "1인당 GDP가 많은",
   "low": "1인당 GDP가 적은",
   "digits": 1,
   "note": "2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
   "items": [
    {
     "name": "USMCA",
     "value": 62.78334660993651
    },
    {
     "name": "EU",
     "value": 41.56689924108025
    },
    {
     "name": "MERCOSUR",
     "value": 11.100848905200474
    },
    {
     "name": "ASEAN",
     "value": 5.531161013390703
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {
     "EU": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "USMCA": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "ASEAN": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "MERCOSUR": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     }
    },
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2025",
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "2023년 회원 범위를 고정해 2025년 수치를 합산. 현재 회원국 수와 다릅니다. 2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산. 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
     "items": [
      {
       "name": "USMCA",
       "value": 67.759730832627
      },
      {
       "name": "EU",
       "value": 47.08916384192689
      },
      {
       "name": "MERCOSUR",
       "value": 11.51277066327581
      },
      {
       "name": "ASEAN",
       "value": 6.105379292504435
      }
     ]
    }
   }
  },
  {
   "group": "bloc",
   "id": "bloc-area",
   "title": "면적",
   "unit": "백만 km²",
   "year": "2024 면적",
   "source": "UN Demographic Yearbook 2024 표 3 + WDI 보완",
   "phrase": "면적이 넓은",
   "low": "면적이 좁은",
   "digits": 2,
   "note": "2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 면적은 내수면 포함 표면적. UN 면적 미수록 수단 등은 WDI 2023으로 보완. 대륙은 WDI 인구가 있는 국가·지역의 합계. EU 등의 해외영토를 별도 집계하는 UN 표의 국가행 합계이며, 법적 영토 전체 면적과 같다고 단정하지 않습니다.",
   "items": [
    {
     "name": "USMCA",
     "value": 21.7825618
    },
    {
     "name": "MERCOSUR",
     "value": 11.887222
    },
    {
     "name": "ASEAN",
     "value": 4.4684286900000005
    },
    {
     "name": "EU",
     "value": 4.132197212617
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별 · UN 표면적(내수면 포함), 해외영토 별도 집계 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "UN 2024 표면적의 정의·해외영토 분리 기준으로 계산한 표입니다. 다른 집계 범위의 수치와 구별하세요.",
    "sourceUrls": [
     "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/DYB2024/table03.xls"
    ],
    "unstablePairs": [],
    "coverage": {}
   }
  },
  {
   "group": "bloc",
   "id": "bloc-density",
   "title": "인구 밀도",
   "unit": "명/km²",
   "year": "2023 인구·2024 면적",
   "source": "UN Demographic Yearbook 2024 표 3 + WDI 보완",
   "phrase": "인구 밀도가 높은",
   "low": "인구 밀도가 낮은",
   "digits": 0,
   "note": "2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지). 면적은 내수면 포함 표면적. UN 면적 미수록 수단 등은 WDI 2023으로 보완. 대륙은 WDI 인구가 있는 국가·지역의 합계. EU 등의 해외영토를 별도 집계하는 UN 표의 국가행 합계이며, 법적 영토 전체 면적과 같다고 단정하지 않습니다.",
   "items": [
    {
     "name": "ASEAN",
     "value": 154.1619004778165
    },
    {
     "name": "EU",
     "value": 108.63410478797175
    },
    {
     "name": "USMCA",
     "value": 23.254560397941805
    },
    {
     "name": "MERCOSUR",
     "value": 22.453636097651746
    }
   ],
   "scope": "회원국 범위 2023년 · 현재 회원 범위와 구별 · UN 표면적(내수면 포함), 해외영토 별도 집계 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "UN 2024 표면적의 정의·해외영토 분리 기준으로 계산한 표입니다. 다른 집계 범위의 수치와 구별하세요.",
    "sourceUrls": [
     "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/DYB2024/table03.xls",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {}
   }
  },
  {
   "group": "continent",
   "id": "cont-pop",
   "title": "총인구",
   "unit": "억 명",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "총인구가 많은",
   "low": "총인구가 적은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).",
   "items": [
    {
     "name": "아시아",
     "value": 47.40398099
    },
    {
     "name": "아프리카",
     "value": 14.77881002
    },
    {
     "name": "유럽",
     "value": 7.39109513
    },
    {
     "name": "라틴 아메리카",
     "value": 6.57616519
    },
    {
     "name": "앵글로아메리카",
     "value": 3.76925703
    },
    {
     "name": "오세아니아",
     "value": 0.45768939
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {},
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).",
     "items": [
      {
       "name": "아시아",
       "value": 48.02872935
      },
      {
       "name": "아프리카",
       "value": 15.46877498
      },
      {
       "name": "유럽",
       "value": 7.43137967
      },
      {
       "name": "라틴 아메리카",
       "value": 6.6659257
      },
      {
       "name": "앵글로아메리카",
       "value": 3.83557896
      },
      {
       "name": "오세아니아",
       "value": 0.47293944
      }
     ]
    }
   }
  },
  {
   "group": "continent",
   "id": "cont-area",
   "title": "면적",
   "unit": "백만 km²",
   "year": "2024 면적",
   "source": "UN Demographic Yearbook 2024 표 3 + WDI 보완",
   "phrase": "면적이 넓은",
   "low": "면적이 좁은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 면적은 내수면 포함 표면적. UN 면적 미수록 수단 등은 WDI 2023으로 보완. 대륙은 WDI 인구가 있는 국가·지역의 합계.",
   "items": [
    {
     "name": "아시아",
     "value": 31.6910391529415
    },
    {
     "name": "아프리카",
     "value": 30.014397731137468
    },
    {
     "name": "유럽",
     "value": 22.989242212617
    },
    {
     "name": "앵글로아메리카",
     "value": 21.9843268
    },
    {
     "name": "라틴 아메리카",
     "value": 20.452075125528
    },
    {
     "name": "오세아니아",
     "value": 8.51154941
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함 · UN 표면적(내수면 포함), 해외영토 별도 집계 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "UN 2024 표면적의 정의·해외영토 분리 기준으로 계산한 표입니다. 다른 집계 범위의 수치와 구별하세요.",
    "sourceUrls": [
     "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/DYB2024/table03.xls"
    ],
    "unstablePairs": [],
    "coverage": {}
   }
  },
  {
   "group": "continent",
   "id": "cont-density",
   "title": "인구 밀도",
   "unit": "명/km²",
   "year": "2023 인구·2024 면적",
   "source": "UN Demographic Yearbook 2024 표 3 + WDI 보완",
   "phrase": "인구 밀도가 높은",
   "low": "인구 밀도가 낮은",
   "digits": 0,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 면적은 내수면 포함 표면적. UN 면적 미수록 수단 등은 WDI 2023으로 보완. 대륙은 WDI 인구가 있는 국가·지역의 합계.",
   "items": [
    {
     "name": "아시아",
     "value": 149.58165543650233
    },
    {
     "name": "아프리카",
     "value": 49.239069037418
    },
    {
     "name": "라틴 아메리카",
     "value": 32.15402422315436
    },
    {
     "name": "유럽",
     "value": 32.15023384260837
    },
    {
     "name": "앵글로아메리카",
     "value": 17.145201052961056
    },
    {
     "name": "오세아니아",
     "value": 5.3772746647311065
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함 · UN 표면적(내수면 포함), 해외영토 별도 집계 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "UN 2024 표면적의 정의·해외영토 분리 기준으로 계산한 표입니다. 다른 집계 범위의 수치와 구별하세요.",
    "sourceUrls": [
     "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/DYB2024/table03.xls",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {}
   }
  },
  {
   "group": "continent",
   "id": "cont-urban",
   "title": "도시화율",
   "unit": "%",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "도시화율이 높은",
   "low": "도시화율이 낮은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 라틴 아메리카와 앵글로아메리카는 근소한 차이 — 2015년 자료에서는 앵글로아메리카가 더 높았다.",
   "items": [
    {
     "name": "라틴 아메리카",
     "value": 81.04350356199005
    },
    {
     "name": "앵글로아메리카",
     "value": 80.33687583252978
    },
    {
     "name": "유럽",
     "value": 75.24156978344831
    },
    {
     "name": "오세아니아",
     "value": 67.60018404621528
    },
    {
     "name": "아시아",
     "value": 52.8786007978694
    },
    {
     "name": "아프리카",
     "value": 45.48370836964044
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "강의 2015년 표와 WDI 2023/2025년 표에서 앵글로·라틴 아메리카의 순서가 다릅니다. 국가별 도시 정의와 판본도 확인하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.URB.TOTL?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [
     [
      "라틴 아메리카",
      "앵글로아메리카"
     ]
    ],
    "coverage": {},
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.URB.TOTL?format=json&date=2025",
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 라틴 아메리카와 앵글로아메리카는 근소한 차이 — 2015년 자료에서는 앵글로아메리카가 더 높았다.",
     "items": [
      {
       "name": "라틴 아메리카",
       "value": 81.50605879090432
      },
      {
       "name": "앵글로아메리카",
       "value": 80.4881610363198
      },
      {
       "name": "유럽",
       "value": 75.53076130209345
      },
      {
       "name": "오세아니아",
       "value": 67.94258055534553
      },
      {
       "name": "아시아",
       "value": 53.47715410672217
      },
      {
       "name": "아프리카",
       "value": 46.37683203275868
      }
     ]
    }
   }
  },
  {
   "group": "continent",
   "id": "cont-nir",
   "title": "인구 자연 증가율",
   "unit": "‰",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "자연 증가율이 높은",
   "low": "자연 증가율이 낮은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 출생률 − 사망률. 유럽은 음수(자연 감소).",
   "items": [
    {
     "name": "아프리카",
     "value": 23.465344098452658
    },
    {
     "name": "오세아니아",
     "value": 7.910282994346887
    },
    {
     "name": "라틴 아메리카",
     "value": 7.599178886058365
    },
    {
     "name": "아시아",
     "value": 6.760587045066608
    },
    {
     "name": "앵글로아메리카",
     "value": 1.4042328761644574
    },
    {
     "name": "유럽",
     "value": -2.7721574032642713
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.CBRT.IN?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.CDRT.IN?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {},
    "latest": {
     "year": "2024",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.CBRT.IN?format=json&date=2024",
      "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.CDRT.IN?format=json&date=2024",
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2024"
     ],
     "note": "",
     "items": [
      {
       "name": "아프리카",
       "value": 23.180885713450145
      },
      {
       "name": "오세아니아",
       "value": 7.771099615005589
      },
      {
       "name": "라틴 아메리카",
       "value": 7.392009640701738
      },
      {
       "name": "아시아",
       "value": 6.789348014158373
      },
      {
       "name": "앵글로아메리카",
       "value": 1.5347950458944917
      },
      {
       "name": "유럽",
       "value": -3.0099449891663452
      }
     ]
    }
   }
  },
  {
   "group": "continent",
   "id": "cont-old",
   "title": "노년층(65세 이상) 비율",
   "unit": "%",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "노년층 비율이 높은",
   "low": "노년층 비율이 낮은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).",
   "items": [
    {
     "name": "유럽",
     "value": 20.123792264056544
    },
    {
     "name": "앵글로아메리카",
     "value": 17.635986739805855
    },
    {
     "name": "오세아니아",
     "value": 13.290369261127072
    },
    {
     "name": "아시아",
     "value": 9.777446562932646
    },
    {
     "name": "라틴 아메리카",
     "value": 9.52871030297218
    },
    {
     "name": "아프리카",
     "value": 3.5775315420151803
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.65UP.TO?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {},
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.65UP.TO?format=json&date=2025",
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).",
     "items": [
      {
       "name": "유럽",
       "value": 20.976534361350964
      },
      {
       "name": "앵글로아메리카",
       "value": 18.590329580908953
      },
      {
       "name": "오세아니아",
       "value": 13.881384052046917
      },
      {
       "name": "아시아",
       "value": 10.22599116501507
      },
      {
       "name": "라틴 아메리카",
       "value": 10.158753644673837
      },
      {
       "name": "아프리카",
       "value": 3.6918112826540064
      }
     ]
    }
   }
  },
  {
   "group": "continent",
   "id": "cont-young",
   "title": "유소년층(0~14세) 비율",
   "unit": "%",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "유소년층 비율이 높은",
   "low": "유소년층 비율이 낮은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).",
   "items": [
    {
     "name": "아프리카",
     "value": 39.457274314430904
    },
    {
     "name": "아시아",
     "value": 23.04176833229297
    },
    {
     "name": "라틴 아메리카",
     "value": 22.876163030205145
    },
    {
     "name": "오세아니아",
     "value": 22.641553914981515
    },
    {
     "name": "앵글로아메리카",
     "value": 17.35115686711341
    },
    {
     "name": "유럽",
     "value": 15.493826420280426
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.0014.TO?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [
     [
      "라틴 아메리카",
      "오세아니아"
     ]
    ],
    "coverage": {},
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.0014.TO?format=json&date=2025",
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).",
     "items": [
      {
       "name": "아프리카",
       "value": 38.7985071717683
      },
      {
       "name": "아시아",
       "value": 22.22572898443752
      },
      {
       "name": "오세아니아",
       "value": 22.18166452770359
      },
      {
       "name": "라틴 아메리카",
       "value": 22.142658145739606
      },
      {
       "name": "앵글로아메리카",
       "value": 16.868871342437437
      },
      {
       "name": "유럽",
       "value": 15.051152675126339
      }
     ]
    }
   }
  },
  {
   "group": "continent",
   "id": "cont-netmig",
   "title": "순이동(순유입 + / 순유출 −)",
   "unit": "만 명",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "순유입이 많은",
   "low": "순유출이 많은",
   "digits": 0,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 앵글로아메리카·유럽·오세아니아는 순유입, 라틴 아메리카·아프리카·아시아는 순유출.",
   "items": [
    {
     "name": "앵글로아메리카",
     "value": 175.6192
    },
    {
     "name": "유럽",
     "value": 153.8272
    },
    {
     "name": "오세아니아",
     "value": 14.6429
    },
    {
     "name": "라틴 아메리카",
     "value": -36.7375
    },
    {
     "name": "아프리카",
     "value": -45.182
    },
    {
     "name": "아시아",
     "value": -257.0788
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SM.POP.NETM?format=json&date=2023"
    ],
    "unstablePairs": [
     [
      "라틴 아메리카",
      "아프리카"
     ]
    ],
    "coverage": {},
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SM.POP.NETM?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 앵글로아메리카·유럽·오세아니아는 순유입, 라틴 아메리카·아프리카·아시아는 순유출.",
     "items": [
      {
       "name": "앵글로아메리카",
       "value": 155.66
      },
      {
       "name": "유럽",
       "value": 149.5779
      },
      {
       "name": "오세아니아",
       "value": 14.061
      },
      {
       "name": "아프리카",
       "value": -38.0275
      },
      {
       "name": "라틴 아메리카",
       "value": -40.1848
      },
      {
       "name": "아시아",
       "value": -236.8702
      }
     ]
    }
   }
  },
  {
   "group": "continent",
   "id": "cont-gdp",
   "title": "GDP 합계",
   "unit": "조 달러",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "GDP가 많은",
   "low": "GDP가 적은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
   "items": [
    {
     "name": "아시아",
     "value": 38.53211672584807
    },
    {
     "name": "앵글로아메리카",
     "value": 30.020039740321813
    },
    {
     "name": "유럽",
     "value": 26.015533065710585
    },
    {
     "name": "라틴 아메리카",
     "value": 6.742124743919806
    },
    {
     "name": "아프리카",
     "value": 2.9929466144072965
    },
    {
     "name": "오세아니아",
     "value": 2.0488401839675205
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "GDP 결측 국가·지역이 있어 완전한 대륙 합계가 아닙니다. 참고표로만 보고 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {
     "아프리카": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "ERI",
        "SSD"
       ],
       "coveragePopulationPct": 98.98816183577952
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "라틴 아메리카": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "VGB",
        "CUB",
        "MAF",
        "VIR"
       ],
       "coveragePopulationPct": 98.29819542595766
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [
        "VGB",
        "PRI",
        "MAF",
        "VIR"
       ],
       "coveragePopulationPct": 99.4867508795046
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [
        "VGB",
        "PRI",
        "MAF",
        "VIR"
       ],
       "coveragePopulationPct": 99.4867508795046
      }
     },
     "앵글로아메리카": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "아시아": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "PRK",
        "SYR",
        "YEM"
       ],
       "coveragePopulationPct": 98.11400595197142
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [
        "PSE"
       ],
       "coveragePopulationPct": 99.89102655743007
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [
        "PSE"
       ],
       "coveragePopulationPct": 99.89102655743007
      }
     },
     "유럽": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "GIB"
       ],
       "coveragePopulationPct": 99.99479495266624
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [
        "IMN",
        "GIB",
        "SMR",
        "LIE",
        "MCO"
       ],
       "coveragePopulationPct": 99.96816466357672
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [
        "IMN",
        "GIB",
        "SMR",
        "LIE",
        "MCO"
       ],
       "coveragePopulationPct": 99.96816466357672
      }
     },
     "오세아니아": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "GUM",
        "MNP",
        "ASM"
       ],
       "coveragePopulationPct": 99.43374260871549
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     }
    },
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산. 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
     "items": [
      {
       "name": "아시아",
       "value": 41.00443579625828
      },
      {
       "name": "앵글로아메리카",
       "value": 33.08959977242592
      },
      {
       "name": "유럽",
       "value": 29.90266344621766
      },
      {
       "name": "라틴 아메리카",
       "value": 7.181822296819294
      },
      {
       "name": "아프리카",
       "value": 3.146183362857056
      },
      {
       "name": "오세아니아",
       "value": 2.108080815601711
      }
     ]
    },
    "quizDisabled": true
   }
  },
  {
   "group": "continent",
   "id": "cont-gdppc",
   "title": "1인당 GDP",
   "unit": "천 달러",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "1인당 GDP가 많은",
   "low": "1인당 GDP가 적은",
   "digits": 1,
   "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
   "items": [
    {
     "name": "앵글로아메리카",
     "value": 79.64444849844006
    },
    {
     "name": "오세아니아",
     "value": 45.01978869564292
    },
    {
     "name": "유럽",
     "value": 35.20031443162751
    },
    {
     "name": "라틴 아메리카",
     "value": 10.429861098214888
    },
    {
     "name": "아시아",
     "value": 8.28470490548529
    },
    {
     "name": "아프리카",
     "value": 2.045861568958836
    }
   ],
   "scope": "UN M49 · 러시아 전체를 유럽에, 북부 아메리카를 앵글로아메리카에 포함",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "GDP 결측 국가·지역이 있어 완전한 대륙 합계가 아닙니다. 참고표로만 보고 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2023",
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "coverage": {
     "아프리카": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "ERI",
        "SSD"
       ],
       "coveragePopulationPct": 98.98816183577952
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "라틴 아메리카": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "VGB",
        "CUB",
        "MAF",
        "VIR"
       ],
       "coveragePopulationPct": 98.29819542595766
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [
        "VGB",
        "PRI",
        "MAF",
        "VIR"
       ],
       "coveragePopulationPct": 99.4867508795046
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [
        "VGB",
        "PRI",
        "MAF",
        "VIR"
       ],
       "coveragePopulationPct": 99.4867508795046
      }
     },
     "앵글로아메리카": {
      "NY.GDP.MKTP.CD": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     },
     "아시아": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "PRK",
        "SYR",
        "YEM"
       ],
       "coveragePopulationPct": 98.11400595197142
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [
        "PSE"
       ],
       "coveragePopulationPct": 99.89102655743007
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [
        "PSE"
       ],
       "coveragePopulationPct": 99.89102655743007
      }
     },
     "유럽": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "GIB"
       ],
       "coveragePopulationPct": 99.99479495266624
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [
        "IMN",
        "GIB",
        "SMR",
        "LIE",
        "MCO"
       ],
       "coveragePopulationPct": 99.96816466357672
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [
        "IMN",
        "GIB",
        "SMR",
        "LIE",
        "MCO"
       ],
       "coveragePopulationPct": 99.96816466357672
      }
     },
     "오세아니아": {
      "NY.GDP.MKTP.CD": {
       "missing": [
        "GUM",
        "MNP",
        "ASM"
       ],
       "coveragePopulationPct": 99.43374260871549
      },
      "SP.URB.TOTL": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.65UP.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SP.POP.0014.TO": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "SM.POP.NETM": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TX.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      },
      "TM.VAL.MRCH.CD.WT": {
       "missing": [],
       "coveragePopulationPct": 100.0
      }
     }
    },
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2025",
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카). 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산. 결측 국가·지역을 0으로 간주하지 않고 자료가 있는 곳의 합계/비율로 계산. 1인당 GDP는 GDP와 인구가 모두 있는 곳만 계산.",
     "items": [
      {
       "name": "앵글로아메리카",
       "value": 86.29746753230651
      },
      {
       "name": "오세아니아",
       "value": 45.376469280817446
      },
      {
       "name": "유럽",
       "value": 40.25422449837222
      },
      {
       "name": "라틴 아메리카",
       "value": 10.969703432609144
      },
      {
       "name": "아시아",
       "value": 8.822520330765157
      },
      {
       "name": "아프리카",
       "value": 2.054876201885845
      }
     ]
    },
    "quizDisabled": true
   }
  },
  {
   "group": "country",
   "id": "country-pop",
   "title": "국가 인구 상위",
   "unit": "억 명",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "인구가 많은",
   "low": "인구가 적은",
   "digits": 2,
   "note": "인도가 2023년 중국을 넘어 1위.",
   "items": [
    {
     "name": "인도",
     "value": 14.38069596
    },
    {
     "name": "중국",
     "value": 14.1071
    },
    {
     "name": "미국",
     "value": 3.36755052
    },
    {
     "name": "인도네시아",
     "value": 2.81190067
    },
    {
     "name": "파키스탄",
     "value": 2.47504495
    },
    {
     "name": "나이지리아",
     "value": 2.27882945
    },
    {
     "name": "브라질",
     "value": 2.11140729
    },
    {
     "name": "방글라데시",
     "value": 1.7146699
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2025"
     ],
     "note": "",
     "items": [
      {
       "name": "인도",
       "value": 14.63865525
      },
      {
       "name": "중국",
       "value": 14.06585
      },
      {
       "name": "미국",
       "value": 3.41784857
      },
      {
       "name": "인도네시아",
       "value": 2.85721236
      },
      {
       "name": "파키스탄",
       "value": 2.55219554
      },
      {
       "name": "나이지리아",
       "value": 2.37527782
      },
      {
       "name": "브라질",
       "value": 2.12812405
      },
      {
       "name": "방글라데시",
       "value": 1.75686899
      }
     ]
    }
   }
  },
  {
   "group": "country",
   "id": "country-area",
   "title": "국가 면적 상위",
   "unit": "백만 km²",
   "year": "2024",
   "source": "UN Demographic Yearbook 2024 표 3",
   "phrase": "면적이 넓은",
   "low": "면적이 좁은",
   "digits": 2,
   "note": "내수면 포함 표면적. 캐나다 9,984,670 km². 미국·중국은 영해·내수면 등 정의에 따라 순서가 달라질 수 있습니다.",
   "items": [
    {
     "name": "러시아",
     "value": 17.098246
    },
    {
     "name": "캐나다",
     "value": 9.98467
    },
    {
     "name": "미국",
     "value": 9.8335168
    },
    {
     "name": "중국",
     "value": 9.6
    },
    {
     "name": "브라질",
     "value": 8.510417
    },
    {
     "name": "오스트레일리아",
     "value": 7.692024
    },
    {
     "name": "인도",
     "value": 3.287263
    },
    {
     "name": "아르헨티나",
     "value": 2.796427
    }
   ],
   "scope": "UN 표면적(내수면 포함), 해외영토 별도 집계 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "UN 2024 표면적의 정의·해외영토 분리 기준으로 계산한 표입니다. 다른 집계 범위의 수치와 구별하세요.",
    "sourceUrls": [
     "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/DYB2024/table03.xls"
    ],
    "unstablePairs": [
     [
      "미국",
      "중국"
     ]
    ]
   }
  },
  {
   "group": "country",
   "id": "country-gdp",
   "title": "국가 GDP 상위",
   "unit": "조 달러",
   "year": "2023",
   "source": "세계은행 WDI, 2026-10-17 확인",
   "phrase": "GDP가 많은",
   "low": "GDP가 적은",
   "digits": 2,
   "note": "명목 GDP.",
   "items": [
    {
     "name": "미국",
     "value": 27.811517
    },
    {
     "name": "중국",
     "value": 18.2703566545332
    },
    {
     "name": "독일",
     "value": 4.56220753249028
    },
    {
     "name": "일본",
     "value": 4.38485426996193
    },
    {
     "name": "인도",
     "value": 3.5009060306447597
    },
    {
     "name": "영국",
     "value": 3.42079665378908
    },
    {
     "name": "프랑스",
     "value": 3.05625064813829
    },
    {
     "name": "이탈리아",
     "value": 2.31688229636632
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2023"
    ],
    "unstablePairs": [
     [
      "영국",
      "인도"
     ]
    ],
    "latest": {
     "year": "2025",
     "source": "세계은행 WDI, 2026-10-17 확인",
     "sourceUrls": [
      "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2025"
     ],
     "note": "",
     "items": [
      {
       "name": "미국",
       "value": 30.7697
      },
      {
       "name": "중국",
       "value": 19.498039388042603
      },
      {
       "name": "독일",
       "value": 5.0509229250470495
      },
      {
       "name": "일본",
       "value": 4.43516299997694
      },
      {
       "name": "영국",
       "value": 4.00258754184601
      },
      {
       "name": "인도",
       "value": 3.95606711577163
      },
      {
       "name": "프랑스",
       "value": 3.36631592744733
      },
      {
       "name": "러시아",
       "value": 2.56131016935874
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "oil-prod",
   "title": "석유 생산 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "석유 생산이 많은",
   "low": "석유 생산이 적은",
   "digits": 0,
   "note": "러시아와 사우디아라비아는 근소한 차이 — 단위(배럴·톤·에너지)에 따라 순서가 바뀐다.",
   "items": [
    {
     "name": "미국",
     "value": 9652.758
    },
    {
     "name": "러시아",
     "value": 6299.022
    },
    {
     "name": "사우디아라비아",
     "value": 6151.1606
    },
    {
     "name": "캐나다",
     "value": 3229.7332
    },
    {
     "name": "이란",
     "value": 2511.3992
    },
    {
     "name": "이라크",
     "value": 2477.664
    }
   ],
   "scope": "에너지 환산 TWh · 부피·중량 기준 순위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 상위국 순서 또는 구성에 변동이 있습니다. 기본 문제에서는 확인된 변동 비교를 제외합니다.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [
     [
      "러시아",
      "사우디아라비아"
     ],
     [
      "이란",
      "이라크"
     ]
    ],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "미국",
       "value": 10349.585
      },
      {
       "name": "사우디아라비아",
       "value": 6231.614
      },
      {
       "name": "러시아",
       "value": 6085.4487
      },
      {
       "name": "캐나다",
       "value": 3514.414
      },
      {
       "name": "이란",
       "value": 2816.1655
      },
      {
       "name": "중국",
       "value": 2513.0918
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "gas-prod",
   "title": "천연가스 생산 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "천연가스 생산이 많은",
   "low": "천연가스 생산이 적은",
   "digits": 0,
   "note": "",
   "items": [
    {
     "name": "미국",
     "value": 10288.885
    },
    {
     "name": "러시아",
     "value": 5863.822
    },
    {
     "name": "이란",
     "value": 2597.375
    },
    {
     "name": "중국",
     "value": 2342.5835
    },
    {
     "name": "캐나다",
     "value": 1950.195
    },
    {
     "name": "카타르",
     "value": 1809.7659
    }
   ],
   "scope": "에너지 환산 TWh · 부피·중량 기준 순위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "미국",
       "value": 10737.427
      },
      {
       "name": "러시아",
       "value": 6093.8584
      },
      {
       "name": "이란",
       "value": 2648.254
      },
      {
       "name": "중국",
       "value": 2641.2344
      },
      {
       "name": "캐나다",
       "value": 2062.2717
      },
      {
       "name": "카타르",
       "value": 1835.1544
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "coal-prod",
   "title": "석탄 생산 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "석탄 생산이 많은",
   "low": "석탄 생산이 적은",
   "digits": 0,
   "note": "중국이 압도적 1위. 미국과 오스트레일리아는 근소한 차이.",
   "items": [
    {
     "name": "중국",
     "value": 25608.953
    },
    {
     "name": "인도",
     "value": 4674.3823
    },
    {
     "name": "인도네시아",
     "value": 4370.5825
    },
    {
     "name": "미국",
     "value": 3271.5413
    },
    {
     "name": "오스트레일리아",
     "value": 3188.7532
    },
    {
     "name": "러시아",
     "value": 2554.2742
    }
   ],
   "scope": "에너지 환산 TWh · 부피·중량 기준 순위와 구별",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 상위국 순서 또는 구성에 변동이 있습니다. 기본 문제에서는 확인된 변동 비교를 제외합니다.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [
     [
      "미국",
      "오스트레일리아"
     ]
    ],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "중국",
       "value": 26295.787
      },
      {
       "name": "인도",
       "value": 4991.563
      },
      {
       "name": "인도네시아",
       "value": 4454.129
      },
      {
       "name": "미국",
       "value": 3067.0208
      },
      {
       "name": "오스트레일리아",
       "value": 3024.478
      },
      {
       "name": "러시아",
       "value": 2545.0132
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "primary-mix",
   "title": "세계 1차 에너지 소비 구성",
   "unit": "%",
   "year": "2023",
   "source": "EI/OWID 기존 대체법 계열",
   "phrase": "비중이 큰",
   "low": "비중이 작은",
   "digits": 1,
   "note": "2023년 대체법(substitution method) 자료. 현행 EI/OWID의 물리적 에너지 함량 방식과 다릅니다. 수력·원자력·풍력·태양광의 비중 순서를 현재 값으로 일반화하지 않습니다.",
   "items": [
    {
     "name": "석유",
     "value": 32.1
    },
    {
     "name": "석탄",
     "value": 26.5
    },
    {
     "name": "천연가스",
     "value": 23.5
    },
    {
     "name": "수력",
     "value": 6.1
    },
    {
     "name": "원자력",
     "value": 3.9
    },
    {
     "name": "풍력",
     "value": 3.3
    },
    {
     "name": "태양광",
     "value": 2.4
    }
   ],
   "scope": "2023년 기존 대체법 · 전력 생산과 다른 지표",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "집계 방식이 바뀐 참고 자료입니다. 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv",
     "https://ourworldindata.org/primary-energy-measurement-change"
    ],
    "unstablePairs": [
     [
      "수력",
      "원자력"
     ],
     [
      "태양광",
      "풍력"
     ]
    ],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv",
      "https://ourworldindata.org/primary-energy-measurement-change"
     ],
     "note": "1차 에너지는 물리적 에너지 함량 방식(TES). 2023년 기존 표의 대체법과 비화석 에너지 비중을 직접 비교하지 않습니다.",
     "items": [
      {
       "name": "석유",
       "value": 33.478043
      },
      {
       "name": "석탄",
       "value": 27.657274
      },
      {
       "name": "천연가스",
       "value": 25.103115
      },
      {
       "name": "원자력",
       "value": 5.170743
      },
      {
       "name": "수력",
       "value": 2.686097
      },
      {
       "name": "태양광",
       "value": 1.6857554
      },
      {
       "name": "풍력",
       "value": 1.6275914
      }
     ]
    },
    "quizDisabled": true
   }
  },
  {
   "group": "energy",
   "id": "elec-mix",
   "title": "세계 전력 생산 구성",
   "unit": "TWh",
   "year": "2023",
   "source": "Energy Institute 통계 (OWID)",
   "phrase": "발전량이 많은",
   "low": "발전량이 적은",
   "digits": 0,
   "note": "전력만의 구성 — 1차 에너지에서는 석유가 1위지만 발전에서는 석탄이 1위.",
   "items": [
    {
     "name": "석탄",
     "value": 10396
    },
    {
     "name": "천연가스",
     "value": 6699
    },
    {
     "name": "수력",
     "value": 4240
    },
    {
     "name": "원자력",
     "value": 2698
    },
    {
     "name": "풍력",
     "value": 2319
    },
    {
     "name": "태양광",
     "value": 1664
    },
    {
     "name": "석유",
     "value": 877
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv",
     "https://ourworldindata.org/primary-energy-measurement-change"
    ],
    "unstablePairs": [
     [
      "태양광",
      "풍력"
     ]
    ],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv",
      "https://ourworldindata.org/primary-energy-measurement-change"
     ],
     "note": "발전량(TWh). 1차 에너지 공급과 다른 지표입니다.",
     "items": [
      {
       "name": "석탄",
       "value": 10471.53
      },
      {
       "name": "천연가스",
       "value": 6921.14
      },
      {
       "name": "수력",
       "value": 4434.97
      },
      {
       "name": "원자력",
       "value": 2811.57
      },
      {
       "name": "태양광",
       "value": 2778.64
      },
      {
       "name": "풍력",
       "value": 2713.14
      },
      {
       "name": "석유",
       "value": 841.62
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "hydro-elec",
   "title": "수력 발전 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "수력 발전량이 많은",
   "low": "수력 발전량이 적은",
   "digits": 0,
   "note": "국가 내부 수력 비중(노르웨이·네팔 등)과 세계 발전량 순위는 다르다.",
   "items": [
    {
     "name": "중국",
     "value": 1226.0
    },
    {
     "name": "브라질",
     "value": 426.0
    },
    {
     "name": "캐나다",
     "value": 360.74
    },
    {
     "name": "미국",
     "value": 239.01
    },
    {
     "name": "러시아",
     "value": 200.87
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "중국",
       "value": 1397.06
      },
      {
       "name": "브라질",
       "value": 388.63
      },
      {
       "name": "캐나다",
       "value": 344.74
      },
      {
       "name": "미국",
       "value": 241.7
      },
      {
       "name": "러시아",
       "value": 199.73
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "nuclear-elec",
   "title": "원자력 발전 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "원자력 발전량이 많은",
   "low": "원자력 발전량이 적은",
   "digits": 0,
   "note": "프랑스는 발전량 3위이지만 자국 발전에서 원자력 비중이 매우 높다.",
   "items": [
    {
     "name": "미국",
     "value": 774.87
    },
    {
     "name": "중국",
     "value": 434.72
    },
    {
     "name": "프랑스",
     "value": 338.2
    },
    {
     "name": "러시아",
     "value": 217.38
    },
    {
     "name": "대한민국",
     "value": 180.49
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "미국",
       "value": 784.78
      },
      {
       "name": "중국",
       "value": 487.61
      },
      {
       "name": "프랑스",
       "value": 392.07
      },
      {
       "name": "러시아",
       "value": 218.65
      },
      {
       "name": "대한민국",
       "value": 184.67
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "wind-elec",
   "title": "풍력 발전 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "풍력 발전량이 많은",
   "low": "풍력 발전량이 적은",
   "digits": 0,
   "note": "영국과 인도는 근소한 차이.",
   "items": [
    {
     "name": "중국",
     "value": 885.87
    },
    {
     "name": "미국",
     "value": 421.14
    },
    {
     "name": "독일",
     "value": 140.54
    },
    {
     "name": "브라질",
     "value": 95.8
    },
    {
     "name": "영국",
     "value": 82.15
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 상위국 순서 또는 구성에 변동이 있습니다. 기본 문제에서는 확인된 변동 비교를 제외합니다.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [
     [
      "영국",
      "인도"
     ]
    ],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "중국",
       "value": 1135.44
      },
      {
       "name": "미국",
       "value": 464.39
      },
      {
       "name": "독일",
       "value": 136.03
      },
      {
       "name": "브라질",
       "value": 117.58
      },
      {
       "name": "인도",
       "value": 103.98
      }
     ]
    }
   }
  },
  {
   "group": "energy",
   "id": "solar-elec",
   "title": "태양광 발전 상위국",
   "unit": "TWh",
   "year": "2023",
   "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
   "phrase": "태양광 발전량이 많은",
   "low": "태양광 발전량이 적은",
   "digits": 0,
   "note": "",
   "items": [
    {
     "name": "중국",
     "value": 584.15
    },
    {
     "name": "미국",
     "value": 238.94
    },
    {
     "name": "인도",
     "value": 115.42
    },
    {
     "name": "일본",
     "value": 96.36
    },
    {
     "name": "독일",
     "value": 63.87
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://github.com/owid/energy-data",
     "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2025",
     "source": "EI Statistical Review 2026 / Ember 2026 (OWID)",
     "sourceUrls": [
      "https://github.com/owid/energy-data",
      "https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv"
     ],
     "note": "",
     "items": [
      {
       "name": "중국",
       "value": 1174.96
      },
      {
       "name": "미국",
       "value": 388.82
      },
      {
       "name": "인도",
       "value": 195.99
      },
      {
       "name": "일본",
       "value": 101.06
      },
      {
       "name": "독일",
       "value": 89.62
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "maize-prod",
   "title": "옥수수 생산 상위국",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "옥수수 생산이 많은",
   "low": "옥수수 생산이 적은",
   "digits": 1,
   "note": "",
   "items": [
    {
     "name": "미국",
     "value": 389.69446
    },
    {
     "name": "중국",
     "value": 288.8423
    },
    {
     "name": "브라질",
     "value": 131.94971
    },
    {
     "name": "아르헨티나",
     "value": 41.40945
    },
    {
     "name": "인도",
     "value": 36.656692
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1198621.metadata.json"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1198621.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "미국",
       "value": 377.6327
      },
      {
       "name": "중국",
       "value": 294.92
      },
      {
       "name": "브라질",
       "value": 114.953304
      },
      {
       "name": "아르헨티나",
       "value": 57.4945
      },
      {
       "name": "인도",
       "value": 40.230572
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": []
    }
   }
  },
  {
   "group": "farm",
   "id": "wheat-prod",
   "title": "밀 생산 상위국",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "밀 생산이 많은",
   "low": "밀 생산이 적은",
   "digits": 1,
   "note": "",
   "items": [
    {
     "name": "중국",
     "value": 136.5901
    },
    {
     "name": "인도",
     "value": 110.55367
    },
    {
     "name": "러시아",
     "value": 92.77
    },
    {
     "name": "미국",
     "value": 49.31393
    },
    {
     "name": "프랑스",
     "value": 35.99557
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1199532.metadata.json"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1199532.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "중국",
       "value": 140.1
      },
      {
       "name": "인도",
       "value": 113.29237
      },
      {
       "name": "러시아",
       "value": 82.588
      },
      {
       "name": "미국",
       "value": 53.65002
      },
      {
       "name": "캐나다",
       "value": 35.93884
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": []
    }
   }
  },
  {
   "group": "farm",
   "id": "rice-prod",
   "title": "쌀 생산 상위국",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "쌀 생산이 많은",
   "low": "쌀 생산이 적은",
   "digits": 1,
   "note": "인도와 중국은 0.6% 차이로 자료 판본에 따라 순서가 바뀐다(강의의 2023년 자료는 중국 1위).",
   "items": [
    {
     "name": "인도",
     "value": 207.75355
    },
    {
     "name": "중국",
     "value": 206.6032
    },
    {
     "name": "방글라데시",
     "value": 60.60118
    },
    {
     "name": "인도네시아",
     "value": 53.98099
    },
    {
     "name": "베트남",
     "value": 43.497624
    }
   ],
   "scope": "쌀은 벼(도정 전) 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "같은 2023년이라도 강의 표는 중국 1위, FAOSTAT 2025판은 인도 1위입니다. 시험에 제시된 표를 우선하세요. 기본 문제에서 두 나라의 직접 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1199243.metadata.json"
    ],
    "unstablePairs": [
     [
      "인도",
      "중국"
     ],
     [
      "방글라데시",
      "인도네시아"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1199243.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "인도",
       "value": 217.86787
      },
      {
       "name": "중국",
       "value": 207.53
      },
      {
       "name": "방글라데시",
       "value": 60.570452
      },
      {
       "name": "인도네시아",
       "value": 53.14273
      },
      {
       "name": "베트남",
       "value": 43.45045
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "인도",
        "중국"
       ],
       "years": [
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022"
       ],
       "of": 10
      },
      {
       "pair": [
        "방글라데시",
        "인도네시아"
       ],
       "years": [
        "2015",
        "2016",
        "2017",
        "2018"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "maize-cont",
   "title": "옥수수 생산의 대륙별 비중",
   "unit": "%",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "옥수수 생산 비중이 큰",
   "low": "옥수수 생산 비중이 작은",
   "digits": 1,
   "note": "세계 생산량 중 각 대륙의 몫. 대륙 내부 작물 구성과 다르다.",
   "items": [
    {
     "name": "앵글로아메리카",
     "value": 32.70798275302429
    },
    {
     "name": "아시아",
     "value": 32.0173093583159
    },
    {
     "name": "라틴 아메리카",
     "value": 17.716634527329376
    },
    {
     "name": "유럽",
     "value": 9.482264382119162
    },
    {
     "name": "아프리카",
     "value": 8.027479611895327
    },
    {
     "name": "오세아니아",
     "value": 0.04832936731595627
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1198621.metadata.json"
    ],
    "unstablePairs": [
     [
      "아시아",
      "앵글로아메리카"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1198621.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "아시아",
       "value": 33.2024745576057
      },
      {
       "name": "앵글로아메리카",
       "value": 32.258728270029415
      },
      {
       "name": "라틴 아메리카",
       "value": 17.648197671918943
      },
      {
       "name": "유럽",
       "value": 8.925919991065909
      },
      {
       "name": "아프리카",
       "value": 7.905968503801068
      },
      {
       "name": "오세아니아",
       "value": 0.058711005578960425
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "앵글로아메리카",
        "아시아"
       ],
       "years": [
        "2022",
        "2024"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "wheat-cont",
   "title": "밀 생산의 대륙별 비중",
   "unit": "%",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "밀 생산 비중이 큰",
   "low": "밀 생산 비중이 작은",
   "digits": 1,
   "note": "세계 생산량 중 각 대륙의 몫. 대륙 내부 작물 구성과 다르다.",
   "items": [
    {
     "name": "아시아",
     "value": 44.74009059913471
    },
    {
     "name": "유럽",
     "value": 34.049803190267255
    },
    {
     "name": "앵글로아메리카",
     "value": 10.411643965081216
    },
    {
     "name": "라틴 아메리카",
     "value": 3.919617080897851
    },
    {
     "name": "오세아니아",
     "value": 3.5767963259988313
    },
    {
     "name": "아프리카",
     "value": 3.302048838620127
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1199532.metadata.json"
    ],
    "unstablePairs": [
     [
      "라틴 아메리카",
      "오세아니아"
     ],
     [
      "오세아니아",
      "아프리카"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1199532.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "아시아",
       "value": 46.59084849010103
      },
      {
       "name": "유럽",
       "value": 30.513280315595757
      },
      {
       "name": "앵글로아메리카",
       "value": 11.2199009414495
      },
      {
       "name": "오세아니아",
       "value": 4.330046626415992
      },
      {
       "name": "라틴 아메리카",
       "value": 4.0771108365361135
      },
      {
       "name": "아프리카",
       "value": 3.2688127899016024
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "오세아니아",
        "아프리카"
       ],
       "years": [
        "2015",
        "2017",
        "2018",
        "2019"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "rice-cont",
   "title": "쌀 생산의 대륙별 비중",
   "unit": "%",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "쌀 생산 비중이 큰",
   "low": "쌀 생산 비중이 작은",
   "digits": 1,
   "note": "세계 생산량 중 각 대륙의 몫. 대륙 내부 작물 구성과 다르다.",
   "items": [
    {
     "name": "아시아",
     "value": 89.61899309284217
    },
    {
     "name": "아프리카",
     "value": 5.36164920283554
    },
    {
     "name": "라틴 아메리카",
     "value": 3.310984624338574
    },
    {
     "name": "앵글로아메리카",
     "value": 1.2303917883676276
    },
    {
     "name": "유럽",
     "value": 0.4149039953341535
    },
    {
     "name": "오세아니아",
     "value": 0.06307729628193953
    }
   ],
   "scope": "쌀은 벼(도정 전) 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1199243.metadata.json"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1199243.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "아시아",
       "value": 89.44606696740178
      },
      {
       "name": "아프리카",
       "value": 5.459510710504977
      },
      {
       "name": "라틴 아메리카",
       "value": 3.3098551749674536
      },
      {
       "name": "앵글로아메리카",
       "value": 1.2284191092284988
      },
      {
       "name": "유럽",
       "value": 0.47914487489567414
      },
      {
       "name": "오세아니아",
       "value": 0.07700316300163268
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": []
    }
   }
  },
  {
   "group": "farm",
   "id": "grain-world",
   "title": "세계 곡물 생산량",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "생산량이 많은",
   "low": "생산량이 적은",
   "digits": 0,
   "note": "쌀은 벼(도정 전) 기준. 밀과 쌀은 근소한 차이.",
   "items": [
    {
     "name": "옥수수",
     "value": 1238.5825
    },
    {
     "name": "쌀(벼)",
     "value": 804.74445
    },
    {
     "name": "밀",
     "value": 794.5674
    }
   ],
   "scope": "쌀은 벼(도정 전) 기준",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://ourworldindata.org/grapher/rice-production"
    ],
    "unstablePairs": [
     [
      "쌀(벼)",
      "밀"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://ourworldindata.org/grapher/rice-production"
     ],
     "note": "",
     "items": [
      {
       "name": "옥수수",
       "value": 1218.2056
      },
      {
       "name": "쌀(벼)",
       "value": 820.2233
      },
      {
       "name": "밀",
       "value": 798.4817
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "쌀(벼)",
        "밀"
       ],
       "years": [
        "2016",
        "2017",
        "2019",
        "2020",
        "2022"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "coffee-prod",
   "title": "커피 생산 상위국",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "커피 생산이 많은",
   "low": "커피 생산이 적은",
   "digits": 2,
   "note": "에티오피아는 아프리카 최대, 베트남은 아시아 최대.",
   "items": [
    {
     "name": "브라질",
     "value": 3.34851
    },
    {
     "name": "베트남",
     "value": 1.9567825
    },
    {
     "name": "인도네시아",
     "value": 0.758725
    },
    {
     "name": "콜롬비아",
     "value": 0.6808576999999999
    },
    {
     "name": "에티오피아",
     "value": 0.5594
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1198207.metadata.json"
    ],
    "unstablePairs": [
     [
      "인도네시아",
      "콜롬비아"
     ],
     [
      "콜롬비아",
      "에티오피아"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1198207.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "브라질",
       "value": 3.387724
      },
      {
       "name": "베트남",
       "value": 2.015289
      },
      {
       "name": "콜롬비아",
       "value": 0.8398467
      },
      {
       "name": "인도네시아",
       "value": 0.807578
      },
      {
       "name": "에티오피아",
       "value": 0.5756962
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "인도네시아",
        "콜롬비아"
       ],
       "years": [
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2024"
       ],
       "of": 10
      },
      {
       "pair": [
        "콜롬비아",
        "에티오피아"
       ],
       "years": [
        "2021"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "cocoa-prod",
   "title": "카카오 생산 상위국",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "카카오 생산이 많은",
   "low": "카카오 생산이 적은",
   "digits": 2,
   "note": "",
   "items": [
    {
     "name": "코트디부아르",
     "value": 1.822441
    },
    {
     "name": "가나",
     "value": 0.6537
    },
    {
     "name": "인도네시아",
     "value": 0.632117
    },
    {
     "name": "에콰도르",
     "value": 0.37571912
    },
    {
     "name": "나이지리아",
     "value": 0.35
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1198170.metadata.json"
    ],
    "unstablePairs": [
     [
      "가나",
      "인도네시아"
     ],
     [
      "에콰도르",
      "나이지리아"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1198170.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "코트디부아르",
       "value": 1.890442
      },
      {
       "name": "인도네시아",
       "value": 0.632702
      },
      {
       "name": "가나",
       "value": 0.53
      },
      {
       "name": "에콰도르",
       "value": 0.40369884
      },
      {
       "name": "나이지리아",
       "value": 0.35
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "가나",
        "인도네시아"
       ],
       "years": [
        "2024"
       ],
       "of": 10
      },
      {
       "pair": [
        "에콰도르",
        "나이지리아"
       ],
       "years": [
        "2015",
        "2016",
        "2017",
        "2018",
        "2020"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "cattle-count",
   "title": "소 사육 두수 상위국",
   "unit": "백만 마리",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "소 사육 두수가 많은",
   "low": "소 사육 두수가 적은",
   "digits": 1,
   "note": "2020년 강의 자료에서는 에티오피아가 중국보다 많았다.",
   "items": [
    {
     "name": "브라질",
     "value": 238.620912
    },
    {
     "name": "인도",
     "value": 194.53944
    },
    {
     "name": "미국",
     "value": 88.841
    },
    {
     "name": "중국",
     "value": 73.559568
    },
    {
     "name": "에티오피아",
     "value": 69.318248
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "연도·판본에 따라 순서가 뒤집힌 비교가 있습니다. 기본 문제에서는 이 비교를 제외합니다.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1197932.metadata.json"
    ],
    "unstablePairs": [
     [
      "에티오피아",
      "중국"
     ]
    ],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1197932.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "브라질",
       "value": 238.180752
      },
      {
       "name": "인도",
       "value": 194.753472
      },
      {
       "name": "미국",
       "value": 87.1574
      },
      {
       "name": "에티오피아",
       "value": 71.916928
      },
      {
       "name": "중국",
       "value": 70.325504
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "중국",
        "에티오피아"
       ],
       "years": [
        "2019",
        "2020",
        "2024"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "pig-count",
   "title": "돼지 사육 두수 상위국",
   "unit": "백만 마리",
   "year": "2023",
   "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
   "phrase": "돼지 사육 두수가 많은",
   "low": "돼지 사육 두수가 적은",
   "digits": 1,
   "note": "중국이 세계 사육 두수의 큰 비중.",
   "items": [
    {
     "name": "중국",
     "value": 434.222688
    },
    {
     "name": "미국",
     "value": 75.461296
    },
    {
     "name": "브라질",
     "value": 43.1242
    },
    {
     "name": "에스파냐",
     "value": 33.80304
    },
    {
     "name": "러시아",
     "value": 27.606148
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "표시한 연도·출처·집계 범위 기준으로 비교하세요.",
    "sourceUrls": [
     "https://api.ourworldindata.org/v1/indicators/1199421.metadata.json"
    ],
    "unstablePairs": [],
    "latest": {
     "year": "2024",
     "source": "FAOSTAT 2025판 (OWID 2026-02-25 처리)",
     "sourceUrls": [
      "https://api.ourworldindata.org/v1/indicators/1199421.metadata.json"
     ],
     "note": "",
     "items": [
      {
       "name": "중국",
       "value": 427.430016
      },
      {
       "name": "미국",
       "value": 74.9054
      },
      {
       "name": "브라질",
       "value": 43.914784
      },
      {
       "name": "에스파냐",
       "value": 34.56528
      },
      {
       "name": "러시아",
       "value": 29.01522
      }
     ]
    },
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": []
    }
   }
  },
  {
   "group": "farm",
   "id": "meat-world",
   "title": "세계 육류 생산 구성",
   "unit": "백만 톤",
   "year": "2023",
   "source": "FAOSTAT (OWID)",
   "phrase": "생산량이 많은",
   "low": "생산량이 적은",
   "digits": 1,
   "note": "사육 두수는 소 > 양 > 돼지이지만, 육류 생산량은 돼지가 소보다 많다.",
   "items": [
    {
     "name": "가금류",
     "value": 142.2
    },
    {
     "name": "돼지고기",
     "value": 124.6
    },
    {
     "name": "소고기(물소 포함)",
     "value": 74.7
    },
    {
     "name": "양·염소고기",
     "value": 19.3
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "historical",
    "warning": "기존 기준표의 해당 연도 자료입니다. 최근 동일 정의의 전체 원자료 대조를 마치지 않아 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "강의 2권 P06"
    ],
    "unstablePairs": [],
    "quizDisabled": true
   }
  },
  {
   "group": "religion",
   "id": "religion-world",
   "title": "세계 종교 인구",
   "unit": "%",
   "year": "2020",
   "source": "Pew Research Center (2025)",
   "phrase": "인구가 많은",
   "low": "인구가 적은",
   "digits": 1,
   "note": "크리스트교 약 23억, 무종교 약 19억, 힌두교 약 12억, 불교 약 3.2억, 유대교 약 1,480만 명. 기타 종교 묶음 2.2%는 이 비교표에서 생략했습니다.",
   "items": [
    {
     "name": "크리스트교",
     "value": 28.8
    },
    {
     "name": "이슬람교",
     "value": 25.6
    },
    {
     "name": "무종교",
     "value": 24.2
    },
    {
     "name": "힌두교",
     "value": 14.9
    },
    {
     "name": "불교",
     "value": 4.1
    },
    {
     "name": "유대교",
     "value": 0.2
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "checked",
    "warning": "자료 기준 2020년, 보고서 발행 2025년. 보고서 연도와 인구 기준 연도는 다릅니다.",
    "sourceUrls": [
     "https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/"
    ],
    "unstablePairs": []
   }
  },
  {
   "group": "farm",
   "id": "wheat-export",
   "title": "밀 수출 비중 상위국",
   "unit": "%",
   "year": "2018~2022 평균",
   "source": "강의 2권 P06",
   "phrase": "밀 수출 비중이 큰",
   "low": "밀 수출 비중이 작은",
   "digits": 1,
   "note": "생산 1위 중국은 수출 상위국이 아니다.",
   "items": [
    {
     "name": "러시아",
     "value": 16.5
    },
    {
     "name": "미국",
     "value": 12.5
    },
    {
     "name": "캐나다",
     "value": 11.6
    },
    {
     "name": "프랑스",
     "value": 9.9
    },
    {
     "name": "오스트레일리아",
     "value": 9
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "historical",
    "warning": "기존 기준표의 해당 연도 자료입니다. 최근 동일 정의의 전체 원자료 대조를 마치지 않아 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "강의 2권 P06"
    ],
    "unstablePairs": [
     [
      "러시아",
      "미국"
     ],
     [
      "러시아",
      "캐나다"
     ],
     [
      "러시아",
      "오스트레일리아"
     ],
     [
      "미국",
      "캐나다"
     ],
     [
      "미국",
      "오스트레일리아"
     ],
     [
      "캐나다",
      "프랑스"
     ],
     [
      "캐나다",
      "오스트레일리아"
     ],
     [
      "프랑스",
      "오스트레일리아"
     ]
    ],
    "quizDisabled": true,
    "yearly": {
     "source": "FAOSTAT 교역 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "러시아",
        "미국"
       ],
       "years": [
        "2015"
       ],
       "of": 10
      },
      {
       "pair": [
        "러시아",
        "캐나다"
       ],
       "years": [
        "2015"
       ],
       "of": 10
      },
      {
       "pair": [
        "러시아",
        "오스트레일리아"
       ],
       "years": [
        "2022"
       ],
       "of": 10
      },
      {
       "pair": [
        "미국",
        "캐나다"
       ],
       "years": [
        "2015",
        "2018",
        "2023",
        "2024"
       ],
       "of": 10
      },
      {
       "pair": [
        "미국",
        "오스트레일리아"
       ],
       "years": [
        "2021",
        "2022",
        "2023"
       ],
       "of": 10
      },
      {
       "pair": [
        "캐나다",
        "프랑스"
       ],
       "years": [
        "2022"
       ],
       "of": 10
      },
      {
       "pair": [
        "캐나다",
        "오스트레일리아"
       ],
       "years": [
        "2017",
        "2021",
        "2022",
        "2023"
       ],
       "of": 10
      },
      {
       "pair": [
        "프랑스",
        "오스트레일리아"
       ],
       "years": [
        "2017",
        "2021",
        "2022",
        "2023",
        "2024"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "maize-export",
   "title": "옥수수 수출 비중 상위국",
   "unit": "%",
   "year": "2018~2022 평균",
   "source": "강의 2권 P06",
   "phrase": "옥수수 수출 비중이 큰",
   "low": "옥수수 수출 비중이 작은",
   "digits": 1,
   "note": "아르헨티나와 브라질은 근소한 차이.",
   "items": [
    {
     "name": "미국",
     "value": 30.3
    },
    {
     "name": "아르헨티나",
     "value": 17.5
    },
    {
     "name": "브라질",
     "value": 17.1
    },
    {
     "name": "우크라이나",
     "value": 13.6
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "historical",
    "warning": "기존 기준표의 해당 연도 자료입니다. 최근 동일 정의의 전체 원자료 대조를 마치지 않아 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "강의 2권 P06"
    ],
    "unstablePairs": [
     [
      "미국",
      "브라질"
     ],
     [
      "아르헨티나",
      "브라질"
     ],
     [
      "아르헨티나",
      "우크라이나"
     ],
     [
      "브라질",
      "우크라이나"
     ]
    ],
    "quizDisabled": true,
    "yearly": {
     "source": "FAOSTAT 교역 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "미국",
        "브라질"
       ],
       "years": [
        "2019",
        "2023"
       ],
       "of": 10
      },
      {
       "pair": [
        "아르헨티나",
        "브라질"
       ],
       "years": [
        "2015",
        "2017",
        "2018",
        "2019",
        "2022",
        "2023",
        "2024"
       ],
       "of": 10
      },
      {
       "pair": [
        "아르헨티나",
        "우크라이나"
       ],
       "years": [
        "2015",
        "2023"
       ],
       "of": 10
      },
      {
       "pair": [
        "브라질",
        "우크라이나"
       ],
       "years": [
        "2021"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "group": "farm",
   "id": "grain-trade",
   "title": "세계 곡물 수출량",
   "unit": "억 톤",
   "year": "2018~2022 평균",
   "source": "강의 2권 P06",
   "phrase": "수출량이 많은",
   "low": "수출량이 적은",
   "digits": 1,
   "note": "쌀은 생산량에 비해 국제 이동량이 매우 작다. 밀과 옥수수는 근소한 차이.",
   "items": [
    {
     "name": "밀",
     "value": 2
    },
    {
     "name": "옥수수",
     "value": 1.9
    },
    {
     "name": "쌀",
     "value": 0.5
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "historical",
    "warning": "기존 기준표의 해당 연도 자료입니다. 최근 동일 정의의 전체 원자료 대조를 마치지 않아 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "강의 2권 P06"
    ],
    "unstablePairs": [],
    "quizDisabled": true,
    "yearly": {
     "source": "FAOSTAT 식량 수급표",
     "window": "2015~2024",
     "flips": []
    }
   }
  },
  {
   "group": "farm",
   "id": "sheep-count",
   "title": "양 사육 두수 상위국",
   "unit": "순위",
   "year": "2020",
   "source": "강의 2권 P06 (2023학년도 9월 12번)",
   "phrase": "양 사육 두수가 많은",
   "low": "양 사육 두수가 적은",
   "digits": 0,
   "note": "수치 없이 순위만 제시된 자료. 양모로 유명한 오스트레일리아는 1위가 아니다.",
   "items": [
    {
     "name": "중국",
     "value": 5
    },
    {
     "name": "인도",
     "value": 4
    },
    {
     "name": "오스트레일리아",
     "value": 3
    },
    {
     "name": "나이지리아",
     "value": 2
    },
    {
     "name": "이란",
     "value": 1
    }
   ],
   "scope": "",
   "audit": {
    "checkedAt": "2026-10-17",
    "status": "historical",
    "warning": "기존 기준표의 해당 연도 자료입니다. 최근 동일 정의의 전체 원자료 대조를 마치지 않아 기본 문제에서 제외합니다.",
    "sourceUrls": [
     "강의 2권 P06"
    ],
    "unstablePairs": [
     [
      "인도",
      "오스트레일리아"
     ],
     [
      "나이지리아",
      "이란"
     ]
    ],
    "quizDisabled": true,
    "yearly": {
     "source": "FAOSTAT 생산·사육 통계",
     "window": "2015~2024",
     "flips": [
      {
       "pair": [
        "인도",
        "오스트레일리아"
       ],
       "years": [
        "2015"
       ],
       "of": 10
      },
      {
       "pair": [
        "나이지리아",
        "이란"
       ],
       "years": [
        "2015",
        "2016",
        "2021",
        "2022",
        "2023",
        "2024"
       ],
       "of": 10
      }
     ]
    }
   }
  },
  {
   "id": "renewable-capacity-six",
   "group": "energy",
   "title": "재생에너지 설비 용량 — 제시 6개국",
   "unit": "MW",
   "year": "2023",
   "source": "IRENA Renewable Energy Statistics 2025",
   "phrase": "재생에너지 설비 용량 — 제시 6개국이 큰",
   "low": "재생에너지 설비 용량 — 제시 6개국이 작은",
   "digits": 0,
   "items": [
    {
     "name": "중국",
     "value": 1453701
    },
    {
     "name": "미국",
     "value": 385283
    },
    {
     "name": "브라질",
     "value": 194463
    },
    {
     "name": "인도",
     "value": 175874
    },
    {
     "name": "독일",
     "value": 159886
    },
    {
     "name": "캐나다",
     "value": 107672
    }
   ],
   "scope": "총 재생에너지, 같은 국가·같은 해. 용량=연말 MW, 발전량=연간 GWh. 국가 전체를 망라한 세계 순위가 아니라 제시 6개국 내 순위.",
   "note": "독일은 캐나다보다 설비 용량이 크지만 연간 발전량은 작다. 제시 국가 내 순위이며 세계 상위 6개국이 아니다.",
   "audit": {
    "checkedAt": "2026-10-25",
    "status": "checked",
    "sourceUrls": [
     "https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_DAT_RE_Statistics_2025.pdf"
    ],
    "unstablePairs": []
   }
  },
  {
   "id": "renewable-generation-six",
   "group": "energy",
   "title": "재생에너지 발전량 — 제시 6개국",
   "unit": "GWh",
   "year": "2023",
   "source": "IRENA Renewable Energy Statistics 2025",
   "phrase": "재생에너지 발전량 — 제시 6개국이 큰",
   "low": "재생에너지 발전량 — 제시 6개국이 작은",
   "digits": 0,
   "items": [
    {
     "name": "중국",
     "value": 2842826
    },
    {
     "name": "미국",
     "value": 962076
    },
    {
     "name": "브라질",
     "value": 629904
    },
    {
     "name": "캐나다",
     "value": 418837
    },
    {
     "name": "인도",
     "value": 369970
    },
    {
     "name": "독일",
     "value": 270110
    }
   ],
   "scope": "총 재생에너지, 같은 국가·같은 해. 용량=연말 MW, 발전량=연간 GWh. 국가 전체를 망라한 세계 순위가 아니라 제시 6개국 내 순위.",
   "note": "독일은 캐나다보다 설비 용량이 크지만 연간 발전량은 작다. 제시 국가 내 순위이며 세계 상위 6개국이 아니다.",
   "audit": {
    "checkedAt": "2026-10-25",
    "status": "checked",
    "sourceUrls": [
     "https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_DAT_RE_Statistics_2025.pdf"
    ],
    "unstablePairs": []
   }
  }
 ],
 "groups": [
  {
   "id": "bloc",
   "name": "경제 블록"
  },
  {
   "id": "continent",
   "name": "대륙별 인구·경제"
  },
  {
   "id": "country",
   "name": "국가 순위"
  },
  {
   "id": "energy",
   "name": "에너지·발전"
  },
  {
   "id": "farm",
   "name": "농업·가축"
  },
  {
   "id": "religion",
   "name": "종교"
  }
 ]
});
